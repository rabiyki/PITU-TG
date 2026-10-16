const fs = require('fs');
const path = require('path');

// plugins/ folder-er sob .js file auto-load kore.
// Plugin format:
//   { name, command: 'start' | ['a','b'], desc, run(ctx) }
//   { name, on: 'message:text', run(ctx, next) }
function loadPlugins(bot) {
  const dir = path.join(__dirname, '..', 'plugins');
  const plugins = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => {
      const p = require(path.join(dir, f));
      p.file = f;
      return p;
    });

  bot.use((ctx, next) => {
    ctx.plugins = plugins;
    return next();
  });

  // command plugin age, tarpor `on` plugin
  for (const p of plugins.filter((p) => p.command)) {
    bot.command(p.command, (ctx) => p.run(ctx));
  }
  for (const p of plugins.filter((p) => p.on)) {
    bot.on(p.on, (ctx, next) => p.run(ctx, next));
  }

  console.log(`🔌 ${plugins.length} plugins loaded: ${plugins.map((p) => p.name).join(', ')}`);
  return plugins;
}

module.exports = { loadPlugins };
