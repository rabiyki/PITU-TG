module.exports = {
  name: 'ping',
  command: 'ping',
  desc: 'Bot alive kina check',
  run: async (ctx) => {
    const t = Date.now();
    const m = await ctx.reply('🏓 Pong...');
    await ctx.api.editMessageText(ctx.chat.id, m.message_id, `🏓 Pong! ${Date.now() - t}ms`);
  }
};
