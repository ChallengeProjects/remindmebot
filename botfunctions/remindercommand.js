const 
    Extra = require('telegraf/extra'),
    Reminder = require('../models/reminder.js'),
    ReminderDate = require("../models/reminderDate.js"),
    processTime = require('../nlp/processTime.js'),
    UserManager = require("../userManager.js"),
    logger = require("../logger.js"),
    catchBlocks = require("../errorhandling.js").catchBlocks,
    errorCodes = require("../nlp/errorCodes.js"),
    constants = require("../utils/constants.js"),
    { encodeHTMLEntities } = require("../botutils.js");

function addRemindersToUserFromUtterance(userId, utterance) {
    try {
        var { reminderText, reminderDates } = processTime.getDate(utterance, UserManager.getUserTimezone(userId));
        if (!reminderText || !reminderDates || reminderDates.length == 0) {
            throw "Something went wrong with NLP nothing was returned and no exception was thrown.";
        }
    } catch (err) {
        throw err;
    }

    let reminders = [];

    if (reminderDates.dates) {
        for (let date of reminderDates.dates) {
            let reminder = new Reminder(reminderText, new ReminderDate({ date: date }), userId);
            UserManager.addReminderForUser(userId, reminder);
            reminders.push(reminder);
        }
    }
    else {
        let reminder = new Reminder(reminderText, new ReminderDate(reminderDates), userId);
        UserManager.addReminderForUser(userId, reminder);
        reminders.push(reminder);
    }
    return reminders;
}

function getReminderMarkup(reminder) {
    return Extra.HTML().markup((m) => {
        let buttons = [
            m.callbackButton("✏️⏱", `EDIT-TIME_${reminder.getId()}`),
            m.callbackButton("✏️📖", `EDIT-TEXT_${reminder.getId()}`),
            m.callbackButton("🗑️", `DELETE_${reminder.getId()}`),
            m.callbackButton("⏎", `APPEND-LINE_${reminder.getId()}`)
        ];
        if (reminder.isRecurring() && reminder.isEnabled()) {
            buttons.push(m.callbackButton("🔕", `DISABLE_${reminder.getId()}`));
        } else if (reminder.isRecurring() && !reminder.isEnabled()) {
            buttons.push(m.callbackButton("🔔", `ENABLE_${reminder.getId()}`));
        }

        return m.inlineKeyboard(buttons);
    });
}

function replyWithConfirmation(ctx, reminder, replyToMessageId) {
    let markup = getReminderMarkup(reminder);
    if (replyToMessageId) {
        markup.reply_to_message_id = replyToMessageId;
    }
    let isRecurringText = reminder.isRecurring() ? "🔄⏱" : "⏱";
    return ctx.reply(`<code>${isRecurringText} Alright I will remind you ${reminder.getDateFormatted()} to </code>${encodeHTMLEntities(reminder.getShortenedText())}`, markup).catch(catchBlocks);
}

function remindmeCallBack(ctx) {
    let userId = ctx.chat.id;
    let utterance = ctx.message.text;
    logger.info(`${ctx.chat.id}: COMMAND_REMINDME`, utterance);

    if (!UserManager.getUserTimezone(userId)) {
        return ctx.reply("You need to set a timezone first with /timezone").catch(catchBlocks);
    }
    if (utterance == '/remindme' || utterance == '/r') {
        return ctx.reply('/remindme what? (/help)').catch(catchBlocks);
    }

    try {
        let reminders = addRemindersToUserFromUtterance(userId, utterance);
        for(let reminder of reminders) {
            replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
        }
        // Log utterance so I can run tests on new NLP algos later
        logger.info(`${ctx.chat.id}: remindme REMINDER_VALID ${utterance}`);
    } catch(err) {
        logger.info(`${ctx.chat.id}: remindme REMINDER_INVALID ${utterance}`);
        if(err == errorCodes.NO_DELIMITER_PROVIDED) {
            ctx.replyWithHTML("Sorry, I wasn't able to understand.\n<b>Looks like your reminder was missing a 'to' or a 'that'.</b>\nTry /help").catch(catchBlocks);
        }
        else {
            ctx.replyWithHTML("Sorry, I wasn't able to understand.\nRemember the command is /remindme [in/on/at] [some date/time] to [something].\n<b>Note: date comes BEFORE the reminder text and not after</b>.\nYou can also try /help.").catch(catchBlocks);
        }
    }

    return;
}

function addToBot(bot) {
    const VARIANTS = ['r', 'remind me', ...constants.FRANCO_ARAB_REMINDME_VARIANTS];

    bot.hears(new RegExp(`^(${VARIANTS.join("|")})(.*)`, 'i'), (ctx) => {
        remindmeCallBack(ctx);
    });

    const COMMANDS_VARIANTS = ['r', 'remindme', 'remind', 'reminder', 
        // also add franco arab ones that dont have spaces in them
        ...(constants.FRANCO_ARAB_REMINDME_VARIANTS.filter(x => x.indexOf(" ") == -1)),
    ];
    for(let commandVariant of COMMANDS_VARIANTS) {
        bot.command(commandVariant, remindmeCallBack);
    }
}

module.exports = {
    addToBot: addToBot,
    addRemindersToUserFromUtterance: addRemindersToUserFromUtterance,
    remindmeCallBack: remindmeCallBack,
    replyWithConfirmation: replyWithConfirmation,
    getReminderMarkup: getReminderMarkup,
};