const fbutils = require("./fbutils.js");

function reminderCallback(reminder) {
    let userId = reminder.getUserId();
    console.log("reminderCallback Im sending a message now to userId=" + userId);
    
    let messageWithCards = {
        "title": reminder.getText(),
        "buttons": getButtons(reminder),
    };
    return fbutils.sendFBTextMessageWithRealCards(userId, messageWithCards, "MESSAGE_TAG", "CONFIRMED_EVENT_UPDATE");
}

function getButtons(reminder) {
    let buttons;
    if (!reminder.isRecurring()) {
        const SNOOZE_MAP = {
            "½H": 30 * 60 * 1000,
            "1H": 60 * 60 * 1000,
            "3H": 3 * 60 * 60 * 1000,
        };
        buttons = Object.keys(SNOOZE_MAP).map(k => generateSnoozeButton(k, SNOOZE_MAP[k], reminder));
    }
    else {
        const SNOOZE_MAP = {
            "½H": 30 * 60 * 1000,
            "1H": 60 * 60 * 1000,
        };
        buttons = Object.keys(SNOOZE_MAP).map(k => generateSnoozeButton(k, SNOOZE_MAP[k], reminder));
        buttons.push({
            'title': "Delete",
            'payload': `DELETE_REMINDER_${reminder.getId()}`,
            'type': "POSTBACK",
        });
    }
    return buttons;
}

function generateSnoozeButton(key, value, reminder) {
    return {
        'title': `Snooze ${key}`,
        'payload': `SNOOZE_${value}_${reminder.getId()}`,
        'type': "POSTBACK"
    };
}

module.exports = {
    reminderCallback: reminderCallback,
};