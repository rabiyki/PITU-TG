const { Bot } = require('grammy');
const config = require('./config');
const { loadPlugins } = require('./lib/loader');

if (!config.token) {
  console.error('BOT_TOKEN missing. Copy .env.example to .env and fill it.');
  process.exit(1);
}

const bot = new Bot(config.token);
loadPlugins(bot);

bot.catch((err) => console.error('Bot error:', err.error || err));
bot.start({ onStart: (me) => console.log(`✅ @${me.username} is running`) });
