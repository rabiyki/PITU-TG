require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  apiBase: process.env.API_BASE || 'https://rabbitapi.zone.id',
  apiPath: process.env.API_PATH || '/api/download',
  apiKey: process.env.API_KEY || '',
  maxMB: 50
};
