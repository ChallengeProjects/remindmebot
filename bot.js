const Telegraf = require('telegraf'),
    config = require("./config.json")[process.env.NODE_ENV],
    session = require('telegraf/session');

const bot = new Telegraf(config.botToken);
bot.use(session());

module.exports = bot;

