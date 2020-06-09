const Telegraf = require('telegraf'),
    config = require("./"+process.env["config"])[process.env.NODE_ENV],
    session = require('telegraf/session');

const bot = new Telegraf(config.botToken, { username: config.username });
bot.use(session());

module.exports = bot;