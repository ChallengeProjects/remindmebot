const 
    Reminder = require('../models/reminder.js'),
    ReminderDate = require("../models/reminderDate.js"),
    processTime = require('../nlp/processTime.js'),
    UserManager = require("../userManager.js"),
    logger = require("../logger.js"),
    catchBlocks = require("../errorhandling.js").catchBlocks,
    errorCodes = require("../nlp/errorCodes.js");


function addRemindersToUserFromUtterance(utterance, ctx, replyWithConfirmationCallBack) {
    let userId = ctx.chat.id;

    try {
        var { reminderText, reminderDates } = processTime.getDate(utterance, UserManager.getUserTimezone(userId));
    } catch (err) {
        if(err == errorCodes.NO_DELIMITER_PROVIDED) {
            ctx.replyWithHTML("Sorry, I wasn't able to understand.\n<b>Looks like your reminder was missing a 'to' or a 'that'.</b>\nTry /help").catch(catchBlocks);
        }
        else {
            ctx.replyWithHTML("Sorry, I wasn't able to understand.\nRemember the command is /remindme [in/on/at] [some date/time] to [something].\n<b>Note: date comes BEFORE the reminder text and not after</b>.\nYou can also try /help.").catch(catchBlocks);
        }
        return false;
    }

    if (reminderDates.dates) {
        for (let date of reminderDates.dates) {
            let reminder = new Reminder(reminderText, new ReminderDate({ date: date }), userId);
            UserManager.addReminderForUser(userId, reminder);
            replyWithConfirmationCallBack(ctx, reminder, ctx.update.message.message_id);
        }
    }
    else {
        let reminder = new Reminder(reminderText, new ReminderDate(reminderDates), userId);
        UserManager.addReminderForUser(userId, reminder);
        replyWithConfirmationCallBack(ctx, reminder, ctx.update.message.message_id);
    }
    return true;
}

function remindmeCallBack(ctx, replyWithConfirmationCallBack) {
    let userId = ctx.chat.id;
    let utterance = ctx.message.text;
    logger.info(`${ctx.chat.id}: COMMAND_REMINDME`);

    if (!UserManager.getUserTimezone(userId)) {
        return ctx.reply("You need to set a timezone first with /timezone").catch(catchBlocks);
    }
    if (utterance == '/remindme') {
        return ctx.reply('/remindme what? (/help)').catch(catchBlocks);
    }

    let success = addRemindersToUserFromUtterance(utterance, ctx, replyWithConfirmationCallBack);
    if(success) {
        // Log utterance so I can run tests on new NLP algos later
        logger.info(`${ctx.chat.id}: remindme REMINDER_VALID ${utterance}`);
    }
    else {
        logger.info(`${ctx.chat.id}: remindme REMINDER_INVALID ${utterance}`);
    }

    return;
}

function addToBot(bot, replyWithConfirmationCallBack) {
    bot.hears(/remind me(.*)/i, (ctx) => {
        ctx.message.text = `/remindme ${ctx.match[1]}`;
        remindmeCallBack(ctx, replyWithConfirmationCallBack);
    });

    bot.command('remindme', (ctx) => {
        remindmeCallBack(ctx, replyWithConfirmationCallBack);
    });

    bot.command('r', (ctx) => {
        remindmeCallBack(ctx, replyWithConfirmationCallBack);
    });
}

module.exports = {
    addToBot: addToBot,
    addRemindersToUserFromUtterance: addRemindersToUserFromUtterance,
    remindmeCallBack: remindmeCallBack,
};