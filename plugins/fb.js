const { InputFile } = require('grammy');
const config = require('../config');
const { tiny, escapeHtml } = require('../lib/utils');

const API = `${config.apiBase}/api/dwnall`;
const FB_REGEX = /https?:\/\/(?:[\w-]+\.)?(?:facebook\.com|fb\.watch|fb\.com)\/\S*/i;

function extractFb(text = '') {
  const m = text.match(FB_REGEX);
  return m ? m[0].replace(/[)\]}>,.!?]+$/, '') : null;
}

async function fetchFb(link) {
  const u = new URL(API);
  u.searchParams.set('url', link);
  const res = await fetch(u, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json();
  const r = data?.result;
  if (!data?.success || !r) throw new Error('download failed');

  if (r.hd || r.ss) return { type: 'video', url: r.hd || r.ss, title: r.title || '' };
  if (r.thumbnail) return { type: 'image', url: r.thumbnail, title: r.title || '' };
  throw new Error('media not found');
}

async function sendMedia(ctx, media) {
  const isVid = media.type === 'video';
  const title = media.title ? `\n${escapeHtml(tiny(media.title.slice(0, 150)))}` : '';
  const opts = {
    caption: `<b>${tiny('facebook downloader')}</b>${title}`,
    parse_mode: 'HTML',
    reply_parameters: { message_id: ctx.message.message_id }
  };
  const send = (file) =>
    isVid
      ? ctx.replyWithVideo(file, { ...opts, supports_streaming: true })
      : ctx.replyWithPhoto(file, opts);

  try {
    return await send(media.url);
  } catch {
    // Fallback: download and upload
    const res = await fetch(media.url);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > config.maxMB * 1024 * 1024) {
      throw new Error(`file is larger than ${config.maxMB}mb`);
    }
    return send(new InputFile(buf, isVid ? 'video.mp4' : 'photo.jpg'));
  }
}

module.exports = {
  name: 'fb',
  category: 'dnl',
  label: 'Facebook',
  command: ['fb', 'facebook'],
  on: 'message:text',
  desc: 'Facebook downloader: /fb <link> (or just send a link)',
  run: async (ctx, next) => {
    const text = (ctx.message?.text || '').trim();

    // Matches: /fb, /Fb, .facebook, !FB, "fb <link>", /fb@botname
    const m = text.match(/^([\/.!#]?)(?:fb|facebook)(?:@\w+)?\b\s*/i);
    const rest = m ? text.slice(m[0].length) : text;
    const url = extractFb(rest);

    if (m) {
      if (!url) {
        if (!m[1]) return next?.(); // plain word "fb" without a prefix
        return ctx.reply(`<b>${tiny('need facebook url')}</b>`, { parse_mode: 'HTML' });
      }
    } else if (!url || !/^https?:\/\//i.test(rest)) {
      return next?.(); // not a bare Facebook link
    }

    const wait = await ctx.reply(`<b>${tiny('please wait...')}</b>`, { parse_mode: 'HTML' });
    try {
      const media = await fetchFb(url);
      await sendMedia(ctx, media);
      await ctx.api.deleteMessage(ctx.chat.id, wait.message_id);
    } catch (e) {
      await ctx.api.editMessageText(
        ctx.chat.id,
        wait.message_id,
        `<b>${tiny('download failed')}</b>\n\n${escapeHtml(String(e.message).slice(0, 150))}`,
        { parse_mode: 'HTML' }
      );
    }
  }
};
