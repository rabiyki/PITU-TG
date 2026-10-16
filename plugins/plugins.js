const { InputFile } = require('grammy');
const config = require('../config');

const SONG_API = `${config.apiBase}/api/song`;

// Search a song via the API and return its details
async function fetchSong(query) {
  const url = new URL(SONG_API);
  url.searchParams.set('url', query);

  const res = await fetch(url, {
    headers: config.apiKey ? { 'x-api-key': config.apiKey } : {},
    signal: AbortSignal.timeout(60000)
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json();
  const r = data.result;
  if (!data.success || !r || !r.url) throw new Error('Song not found');

  return {
    url: r.url,
    title: r.title || query,
    duration: r.duration || '',
    quality: r.quality || ''
  };
}

module.exports = {
  name: 'play',
  command: 'play',
  desc: 'Play a song: /play song name',
  run: async (ctx) => {
    const query = (ctx.match || '').trim();
    if (!query) return ctx.reply('Please provide a song name.\nExample: /play tomake chai');

    const wait = await ctx.reply('🔎 Searching...');
    try {
      const song = await fetchSong(query);
      const opts = {
        title: song.title.slice(0, 64),
        caption: `🎵 ${song.title}\n⏱ ${song.duration} • ${song.quality}`.slice(0, 1000)
      };

      try {
        // Try sending the direct URL first
        await ctx.replyWithAudio(song.url, opts);
      } catch {
        // Fallback: download the file and upload it
        const res = await fetch(song.url);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > config.maxMB * 1024 * 1024) {
          throw new Error(`File is larger than ${config.maxMB}MB`);
        }
        await ctx.replyWithAudio(new InputFile(buf, 'song.mp3'), opts);
      }

      await ctx.api.deleteMessage(ctx.chat.id, wait.message_id);
    } catch (e) {
      await ctx.api.editMessageText(ctx.chat.id, wait.message_id, '❌ Failed: ' + e.message.slice(0, 150));
    }
  }
};
