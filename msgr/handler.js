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
    if (!UserManager.userExists(fbId)) {
        fbutils.getUserInfo(fbId).then(userInfo => {
            if(!userInfo.timezone) {
                return fbutils.sendFBTextMessage(fbId, REQUEST_TIMEZONE_TEXT);
            }
            UserManager.addUser(fbId, null, userInfo.first_name, userInfo.last_name, userInfo.timezone);
            let commandHandler = getCommand(text);
            if (commandHandler) {
                commandHandler(fbId, text);
            }
        });
    }
    let commandHandler = getCommand(text);
    if (commandHandler) {
        commandHandler(fbId, text);
    }
}

function getCommand(text) {
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

    for(let key in TEXT_COMMANDS) {
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
        for(let reminder of reminders) {
            console.log("reminder set =", reminder.getText());
            return fbutils.sendFBTextMessage(fbId, `Alright I will remind you *${reminder.getDateFormatted()}* to *_${reminder.getShortenedText()}_*`);
        }
    } catch(err) {
        if(err == errorCodes.NO_DELIMITER_PROVIDED) {
            fbutils.sendFBTextMessage(fbId, "Sorry, I wasn't able to understand.\n<b>Looks like your reminder was missing a 'to' or a 'that'.</b>\nTry /help");
        }
        else {
            fbutils.sendFBTextMessage(fbId, "Sorry, I wasn't able to understand.\nRemember the command is /remindme [in/on/at] [some date/time] to [something].\n<b>Note: date comes BEFORE the reminder text and not after</b>.\nYou can also try /help.");
        }
    }
}

function listHandler(fbId, text) {
    text = "";//remove "/list" from text
    let allNoneRecurringReminders = UserManager.getUserSortedFutureReminders(fbId, text, false);
    // let allRecurringReminders = UserManager.getUserSortedFutureReminders(fbId, text, true);
    let xx = JSON.stringify(allNoneRecurringReminders.map(r => r.getFormattedReminder(true)));
    fbutils.sendFBTextMessage(fbId, xx);
}

function helpHandler(fbId) {
    return fbutils.sendFBTextMessage(fbId, `You can set a reminder like this:
/r in 3 minutes to check on the oven
/r tomorrow to pick up the kids
/r on june 3rd that i have a dentist appointment`);
}

function timezoneHandler(fbId, text) {
    let textWithoutCommand = stripCommandFromText(text);
    console.log("textWithoutCommand=", textWithoutCommand);
    let result = timezoneCommand.parseTimezone(textWithoutCommand);
    if (!result) {
        return fbutils.sendFBTextMessage(fbId, "This is not a valid timezone, please try again.");
    }
    let {parsedTimezone, timezoneForMoment} = result;
    console.log("timezoneHandler im setting the timezone now to", timezoneForMoment);
    UserManager.setUserTimezone(fbId, timezoneForMoment);
    fbutils.sendFBTextMessage(fbId, "Great your timezone has been set to: " + parsedTimezone + "! You can start setting reminders now.");
    return helpHandler(fbId);
}

function stripCommandFromText(text) {
    return text.split(" ").slice(1).join(" ");
}

module.exports = {
    handle: handle,
};