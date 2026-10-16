const isUrl = (s) => /^https?:\/\/\S+$/i.test(s);
const extractUrl = (s) => (s.match(/https?:\/\/\S+/i) || [])[0];

module.exports = { isUrl, extractUrl };
