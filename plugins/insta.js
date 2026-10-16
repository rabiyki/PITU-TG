const { InputFile } = require('grammy');
const config = require('../config');
const { tiny } = require('../lib/utils');

const PRIMARY_API = 'https://fgsi.dpdns.org/api/downloader/instagram';
const PRIMARY_KEY = process.env.FGSI_KEY || '';
const BACKUP_API = `${config.apiBase}/api/dwnall`;
const IG_REGEX = /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/\S+/i;

function extractIg(text = '') {
  const m = text.match(IG_REGEX);
  return m ? m[0].replace(/[)\]}>,.!?]+$/, '') : null;
}

async function getJson(base, params) {
  const u = new URL(base);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(u, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function isVideo(item) {
  const t = (item?.type || item?.ext || '').toLowerCase();
  return t === 'mp4' || t === 'mov' || t === 'video';
}

function buildItem(item) {
  if (!item?.url?.length) return null;
  const file = item.url[0];
  const url = file?.url || item.thumb;
  if (!url) return null;
  return isVideo(file) ? { type: 'video', url } : { type: 'image', url };
}

async function fetchPrimary(url) {
  if (!PRIMARY_KEY) return null;
  const data = await getJson(PRIMARY_API, { apikey: PRIMARY_KEY, url });
  if (!data?.status) return null;
  // Carousel => array, single post/reel => object
  const items = Array.isArray(data.data)
    ? data.data.map(buildItem).filter(Boolean)
    : [buildItem(data.data)].filter(Boolean);
  return items.length ? items : null;
}

async function fetchBackup(url) {
  const data = await getJson(BACKUP_API, { url });
  if (!data?.success || !data?.result) return null;
  const r = data.result;
  if (r.hd || r.ss) return [{ type: 'video', url: r.hd || r.ss }];
  if (r.thumbnail) return [{ type: 'image', url: r.thumbnail }];
  return null;
}

async function sendOne(ctx, item, caption) {
  const isVid = item.type === 'video';
  const opts = {
    caption,
    parse_mode: 'HTML',
    reply_parameters: { message_id: ctx.message.message_id }
  };
  const send = (file) =>
    isVid
      ? ctx.replyWithVideo(file, { ...opts, supports_streaming: true })
      : ctx.replyWithPhoto(file, opts);

  try {
    return await send(item.url);
  } catch {
    // Fallback: download and upload
    const res = await fetch(item.url);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > config.maxMB * 1024 * 1024) {
      throw new Error(`file is larger than ${config.maxMB}mb`);
    }
    return send(new InputFile(buf, isVid ? 'video.mp4' : 'photo.jpg'));
  }
}

async function sendAll(ctx, items) {
  const list = items.slice(0, 10);
  const caption = `<b>${tiny('instagram downloader')}</b>`;
  if (list.length === 1) return sendOne(ctx, list[0], caption);

  try {
    await ctx.replyWithMediaGroup(
      list.map((it, i) => ({
        type: it.type === 'video' ? 'video' : 'photo',
        media: it.url,
        ...(i === 0 ? { caption, parse_mode: 'HTML' } : {})
      })),
      { reply_parameters: { message_id: ctx.message.message_id } }
    );
  } catch {
    for (let i = 0; i < list.length; i++) {
      await sendOne(ctx, list[i], `${caption}\n${tiny('item')} ${i + 1}/${list.length}`);
    }
  }
}

module.exports = {
  name: 'insta',
  command: 'insta',
  on: 'message:text',
  desc: 'Instagram downloader: /insta <link> (or just send a link)',
  run: async (ctx, next) => {
    const text = (ctx.message?.text || '').trim();

    // Matches: /insta, /Insta, .insta, !INSTA, "insta <link>", /insta@botname
    const m = text.match(/^([\/.!#]?)insta(?:@\w+)?\b\s*/i);
    const rest = m ? text.slice(m[0].length) : text;
    const url = extractIg(rest);

    if (m) {
      if (!url) {
        if (!m[1]) return next?.(); // plain word "insta" without a prefix
        return ctx.reply(`<b>${tiny('need instagram url')}</b>`, { parse_mode: 'HTML' });
      }
    } else if (!url || !/^https?:\/\//i.test(rest)) {
      return next?.(); // not a bare Instagram link
    }

    const wait = await ctx.reply(`<b>${tiny('please wait...')}</b>`, { parse_mode: 'HTML' });
    try {
      const [p, b] = await Promise.allSettled([fetchPrimary(url), fetchBackup(url)]);
      if (p.status === 'rejected') console.warn('[INSTA] primary failed:', p.reason?.message);
      if (b.status === 'rejected') console.warn('[INSTA] backup failed:', b.reason?.message);

      const items = (p.status === 'fulfilled' && p.value) || (b.status === 'fulfilled' && b.value);
      if (!items?.length) throw new Error('media not found');

      await sendAll(ctx, items);
      await ctx.api.deleteMessage(ctx.chat.id, wait.message_id);
    } catch (e) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        wait.message_id,
        `<b>${tiny('download failed')}</b>\n\n${String(e.message).slice(0, 150)}`,
        { parse_mode: 'HTML' }
      );
    }
  }
};
