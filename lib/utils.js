const isUrl = (s) => /^https?:\/\/\S+$/i.test(s);
const extractUrl = (s) => (s.match(/https?:\/\/\S+/i) || [])[0];

// Small-caps font helper
const MAP = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
  s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};
const tiny = (s) => String(s).toLowerCase().replace(/[a-z]/g, (c) => MAP[c]);

module.exports = { isUrl, extractUrl, tiny };
