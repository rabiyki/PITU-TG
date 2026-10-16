const isUrl = (s) => /^https?:\/\/\S+$/i.test(s);
const extractUrl = (s) => (s.match(/https?:\/\/\S+/i) || [])[0];

// Small-caps font helper
const MAP = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
  s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};
const tiny = (s) => String(s).toLowerCase().replace(/[a-z]/g, (c) => MAP[c]);

// Bold first letter + small caps for the rest: "polu bot" -> 𝐏ᴏʟᴜ 𝐁ᴏᴛ
const boldChar = (c) =>
  String.fromCodePoint(0x1d400 + c.toUpperCase().charCodeAt(0) - 65);
const fancy = (s) =>
  String(s)
    .split(' ')
    .map((w) => (/^[a-z]/i.test(w) ? boldChar(w[0]) + tiny(w.slice(1)) : w))
    .join(' ');

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

module.exports = { isUrl, extractUrl, tiny, fancy, escapeHtml };
