const { InputFile } = require('grammy');
const { fancy, escapeHtml } = require('../lib/utils');

const BOT_TITLE = process.env.BOT_NAME || 'Polu X Dl Bot';
const WELCOME_VIDEO =
  process.env.WELCOME_VIDEO || 'https://spider-avik.zone.id/file/5ypjck.mp4';

function welcomeText(name) {
  const text =
    `╭━━ [${fancy(BOT_TITLE)}] ━╮\n` +
    `      \n` +
    `╰━━━━━━  𖹭 ━━━━━━╯\n` +
    ` ┏────────────⟢\n` +
    ` ┃⟥ 𝐖𝛆‌ʟᴄᴏᴍᴇ . ${name} .」\n` +
    ` ┃⟥ 𝐒ᴇɴᴅ ʏᴏᴜʀ ᴠɪᴅᴇᴏ ʟɪɴᴋ ᴛᴏ\n` +
    ` ┃ᴅᴏᴡɴʟᴏᴀᴅ.」\n` +
    ` ┗────────────⟢`;
  return `<b>${escapeHtml(text)}</b>`;
}

module.exports = {
  name: 'start',
  command: 'start',
  desc: 'Start the bot',
  run: async (ctx) => {
    const name = ctx.from?.first_name || ctx.from?.username || 'User';
    const caption = welcomeText(name);
    const opts = { caption, parse_mode: 'HTML' };

    try {
      // Try the direct URL first
      await ctx.replyWithVideo(WELCOME_VIDEO, opts);
    } catch {
      try {
        // Fallback: download and upload
        const res = await fetch(WELCOME_VIDEO);
        const buf = Buffer.from(await res.arrayBuffer());
        await ctx.replyWithVideo(new InputFile(buf, 'welcome.mp4'), opts);
      } catch {
        // Last fallback: text only
        await ctx.reply(caption, { parse_mode: 'HTML' });
      }
    }
  }
};
