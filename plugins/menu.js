const { fancy, escapeHtml } = require('../lib/utils');

const BOT_TITLE = process.env.BOT_NAME || 'Polu X Dl Bot';

// Section order and titles. Plugins with an unknown category get their own section at the end.
const SECTIONS = [
  { key: 'dnl', title: 'Dnl Link' },
  { key: 'media', title: 'Media & Link' },
  { key: 'group', title: 'Grp Admin' },
  { key: 'status', title: 'Status' }
];

function box(title, labels, first) {
  const body = labels.map((l) => ` ┃${fancy(l)} !!`).join('\n');
  return first
    ? ` ┏────〔 ${fancy(title)} 〕────┈⊷\n${body}\n ┗───────────┈⊷`
    : ` ╭━━〔 ${fancy(title)} 〕━━┈⊷\n${body}\n ╰━━━━━━━━━━━━━┈⊷`;
}

module.exports = {
  name: 'menu',
  command: 'menu',
  desc: 'Show the menu',
  run: async (ctx) => {
    // Group plugins by category (auto-detect)
    const groups = {};
    for (const p of ctx.plugins) {
      if (!p.category) continue;
      (groups[p.category] ||= []).push(p.label || p.name);
    }

    const known = SECTIONS.map((s) => s.key);
    const extra = Object.keys(groups)
      .filter((k) => !known.includes(k))
      .map((k) => ({ key: k, title: k }));

    const parts = [...SECTIONS, ...extra]
      .filter((s) => groups[s.key]?.length)
      .map((s, i) => box(s.title, groups[s.key], i === 0));

    const header =
      `╭━━ [${fancy(BOT_TITLE)}] ━╮\n      \n╰━━━━━━  𖹭 ━━━━━━╯`;

    const text = [header, ...parts].join('\n\n');
    await ctx.reply(`<b>${escapeHtml(text)}</b>`, { parse_mode: 'HTML' });
  }
};
