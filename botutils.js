const bot = require("./bot.js"),
    Extra = require('telegraf/extra');

function remindUser(reminder) {
    const SNOOZE_MAP = {
        '15M': 15*60*1000,
        "30M": 30*60*1000,
        "1H": 60*60*1000,
        "3H": 3*60*60*1000,
        "1D": 24*60*60*1000,
    };
    let markup = Extra.HTML().markup((m) => {
        return m.inlineKeyboard(Object.keys(SNOOZE_MAP).map(key => m.callbackButton(key.toLowerCase(), `SNOOZE_${SNOOZE_MAP[key]}_${reminder.getId()}`)));
    });
    bot.telegram.sendMessage(String(reminder.getUserId()), reminder.getText() + '\n\n' + 'Remind me again in:', markup);
}

module.exports = {
    remindUser: remindUser
};