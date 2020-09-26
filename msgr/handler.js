const fbutils = require("./fbutils.js"),
    UserManager = require("../userManager.js"),
    reminderCommand = require("../botfunctions/remindercommand.js"),
    timezoneCommand = require("../botfunctions/timezonecommand.js"),
    constants = require("../utils/constants.js"),
    errorCodes = require("../nlp/errorCodes.js");

const REQUEST_TIMEZONE_TEXT = `Please set your timezone using the /timezone command so you can start setting reminders!

Examples:
• /timezone America Los Angeles
• /timezone Africa Cairo
• /timezone India
• /timezone China Beijing
• /timezone PDT
• /timezone EST`;

function handle(msg) {
    let fbId = fbutils.extractfbId(msg);
    let text = fbutils.extractText(msg);
    let payload = fbutils.extractPayload(msg);
    
    if (!UserManager.userExists(fbId)) {
        fbutils.getUserInfo(fbId).then(userInfo => {
            if (!userInfo.timezone) {
                return fbutils.sendFBTextMessage(fbId, REQUEST_TIMEZONE_TEXT);
            }
            UserManager.addUser(fbId, null, userInfo.first_name, userInfo.last_name, userInfo.timezone);
            let commandHandler = getCommand(text);
            if (commandHandler) {
                commandHandler(fbId, text);
            }
        });
    }
    let commandHandler = getCommand(fbId, text, payload);
    if (commandHandler) {
        commandHandler(fbId, text, payload);
    }
}

function getCommand(fbId, text, payload) {
    // Check if we are in the middle of a transaction
    if (!!UserManager.getUserTemporaryStore(fbId)) {
        const TRANSACTION_COMMANDS = {
            "EDIT_TEXT": editTextHandlerStage2,
        };
        let transaction = UserManager.getUserTemporaryStore(fbId).transaction;
        return TRANSACTION_COMMANDS[transaction];
    }

    // Check if it's a postback
    if (!text && !!payload) {
        const POSTBACK_COMMANDS = {
            'EDIT_TEXT': {
                regex: new RegExp(`^EDIT_TEXT_.*`, 'i'),
                handler: editTextHandler,
            },
            'SNOOZE_': {
                regex: new RegExp(`^SNOOZE_.*`, 'i'),
                handler: snoozeReminderHandler,
            },
            'DELETE_REMINDER': {
                regex: new RegExp(`^DELETE_REMINDER_.*`, 'i'),
                handler: deleteReminderHandler,
            },
        };

        for (let key in POSTBACK_COMMANDS) {
            if (!!payload.match(POSTBACK_COMMANDS[key].regex)) {
                return POSTBACK_COMMANDS[key].handler;
            }
        }
    }
    // /remindme
    const REMINDME_VARIANTS = ['r', 'remindme', 'remind', 'remind me', ...constants.FRANCO_ARAB_REMINDME_VARIANTS];

    // /list
    const LIST_VARIANTS = ['l', 'list'];

    // /help
    const HELP_VARIANTS = ['help'];

    // /timezone
    const TIMEZONE_VARIANTS = ['timezone', 'settimezone'];

    const TEXT_COMMANDS = {
        'REMINDER': {
            regex: new RegExp(`^(${REMINDME_VARIANTS.join("|")})(.*)`, 'i'),
            handler: reminderHandler
        },
        'LIST': {
            regex: new RegExp(`^(${LIST_VARIANTS.join("|")})(.*)`, 'i'),
            handler: listHandler,
        },
        'HELP': {
            regex: new RegExp(`^(${HELP_VARIANTS.join("|")})(.*)`, 'i'),
            handler: helpHandler,
        },
        'TIMEZONE': {
            regex: new RegExp(`^(${TIMEZONE_VARIANTS.join("|")})(.*)`, 'i'),
            handler: timezoneHandler,
        },
        'INVALID_COMMAND': {
            regex: new RegExp(`.*`, 'i'),
            handler: helpHandler
        },
    };

    if (text.startsWith("/")) {
        text = text.slice(1);
    }

    for (let key in TEXT_COMMANDS) {
        if (!!text.match(TEXT_COMMANDS[key].regex)) {
            return TEXT_COMMANDS[key].handler;
        }
    }
}

function reminderHandler(fbId, text) {
    if (!UserManager.getUserTimezone(fbId)) {
        return fbutils.sendFBTextMessage(fbId, REQUEST_TIMEZONE_TEXT);
    }

    try {
        let reminders = reminderCommand.addRemindersToUserFromUtterance(fbId, text);
        for (let reminder of reminders) {
            
            let messageWithCards = {
                "title": `Alright I will remind you *${reminder.getDateFormatted()}* to *_${reminder.getShortenedText()}_*`,
                "buttons": [
                    { title: "Edit text", payload: "EDIT_TEXT_" + reminder.getId(), type: "POSTBACK" },
                    { title: "Delete", payload: "DELETE_REMINDER_" + reminder.getId(), type: "POSTBACK" },
                ],
            };
            return fbutils.sendFBTextMessageWithRealCards(fbId, messageWithCards);
        }
    } catch (err) {
        if (err == errorCodes.NO_DELIMITER_PROVIDED) {
            fbutils.sendFBTextMessage(fbId, "Sorry, I wasn't able to understand.\n<b>Looks like your reminder was missing a 'to' or a 'that'.</b>\nTry /help");
        } else {
            fbutils.sendFBTextMessage(fbId, "Sorry, I wasn't able to understand.\nRemember the command is /remindme [in/on/at] [some date/time] to [something].\n<b>Note: date comes BEFORE the reminder text and not after</b>.\nYou can also try /help.");
        }
    }
}

function listHandler(fbId, text) {
    text = ""; //remove "/list" from text
    let allNoneRecurringReminders = UserManager.getUserSortedFutureReminders(fbId, text, false);
    // let allRecurringReminders = UserManager.getUserSortedFutureReminders(fbId, text, true);
    let xx = JSON.stringify(allNoneRecurringReminders.map(r => r.getFormattedReminder(true)));
    fbutils.sendFBTextMessage(fbId, xx);
}

function helpHandler(fbId) {
    return fbutils.sendFBTextMessage(fbId, `You can set a reminder like this:
"remind me in 3 minutes to check on the oven"
"remind me tomorrow to pick up the kids"
"remind me on june 3rd that i have a dentist appointment"

Make sure you start with "remind me"`);
}

function timezoneHandler(fbId, text) {
    let textWithoutCommand = stripCommandFromText(text);
    
    let result = timezoneCommand.parseTimezone(textWithoutCommand);
    if (!result) {
        return fbutils.sendFBTextMessage(fbId, "This is not a valid timezone, please try again.");
    }
    let { parsedTimezone, timezoneForMoment } = result;
    
    UserManager.setUserTimezone(fbId, timezoneForMoment);
    fbutils.sendFBTextMessage(fbId, "Great your timezone has been set to: " + parsedTimezone + "! You can start setting reminders now.");
    return helpHandler(fbId);
}

function editTextHandler(fbId, _, payload) {
    let reminderId = payload.match(/EDIT_TEXT_(.*)/i)[1];

    UserManager.setUserTemporaryStore(fbId, {
        transaction: "EDIT_TEXT",
        reminderId: reminderId,
    });
    return fbutils.sendFBTextMessage(fbId, "Enter new text:");
}

function editTextHandlerStage2(fbId, text) {
    let reminderId = UserManager.getAndDeleteUserTemporaryStore(fbId).reminderId;
    UserManager.updateReminderText(fbId, reminderId, text);
    return fbutils.sendFBTextMessage(fbId, "Reminder text updated!");
}

function deleteReminderHandler(fbId, _, payload) {
    let reminderId = payload.match(/DELETE_REMINDER_(.*)/i)[1];
    UserManager.deleteReminder(fbId, reminderId);
    return fbutils.sendFBTextMessage(fbId, "Reminder deleted!");
}

function snoozeReminderHandler(fbId, _, payload) {
    let timePeriod = payload.match(/SNOOZE_(.*)_(.*)/i)[1];
    let reminderId = payload.match(/SNOOZE_(.*)_(.*)/i)[2];
    let reminder = UserManager.getReminder(fbId, reminderId);
    if (!reminder) {
        return fbutils.sendFBTextMessage(fbId, "Reminder was already deleted");
    }
    let snoozedReminder = reminder.getSnoozedReminder(parseInt(timePeriod));
    UserManager.addReminderForUser(fbId, snoozedReminder);
    let messageWithCards = {
        "title": `Alright I will remind you *${snoozedReminder.getDateFormatted()}* to *_${snoozedReminder.getShortenedText()}_*`,
        "buttons": [
            { title: "Edit text", payload: "EDIT_TEXT_" + snoozedReminder.getId(), type: "POSTBACK" },
            { title: "Delete", payload: "DELETE_REMINDER_" + snoozedReminder.getId(), type: "POSTBACK" },
        ],
    };
    return fbutils.sendFBTextMessageWithRealCards(fbId, messageWithCards);
}

function stripCommandFromText(text) {
    return text.split(" ").slice(1).join(" ");
}

module.exports = {
    handle: handle,
};