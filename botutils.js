const bot = require("./bot.js"),
    Extra = require('telegraf/extra'),
    logger = require("./logger.js");
    // catchBlocks = require("./errorhandling.js").catchBlocks;

function remindUser(reminder) {
    let reminderId = reminder.getId();
    let userId = reminder.getUserId();
    let reminderText = reminder.getText();
    let isRecurring = reminder.isRecurring();

    const SNOOZE_MAP = {
        '15M': 15*60*1000,
        "30M": 30*60*1000,
        "1H": 60*60*1000,
        "3H": 3*60*60*1000,
        "1D": 24*60*60*1000,
        "1W": 7*24*60*60*1000
    };
    let markup = Extra.HTML().markup((m) => {
        let buttonsRow1 = Object.keys(SNOOZE_MAP).map(key => m.callbackButton(key.toLowerCase(), `SNOOZE_${SNOOZE_MAP[key]}_${reminderId}`));
        let buttonsRow2 = [m.callbackButton('Enter Time', `CUSTOM_SNOOZE_${reminderId}`)];

        if(isRecurring) {
            buttonsRow2.push(m.callbackButton('🗑️', `DELETE_${reminderId}`));
            buttonsRow2.push(m.callbackButton('🚫', `DISABLE_${reminderId}`));
        }
        return m.inlineKeyboard([buttonsRow1, buttonsRow2]);
    });

    let isRecurringText = isRecurring ? "🔄⏱" : "⏱";
    bot.telegram.sendMessage(String(userId), isRecurringText + " " + reminderText + '\n\n' + 'Remind me again in:', markup);//.catch(catchBlocks);
}


function sendMessageToUser({userId, text}) {
    bot.telegram.sendMessage(String(userId), text);//.catch(catchBlocks);
}
module.exports = {
    remindUser: remindUser,
    sendMessageToUser: sendMessageToUser,
};