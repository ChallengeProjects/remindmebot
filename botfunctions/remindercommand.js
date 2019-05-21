const 
    Extra = require('telegraf/extra'),
    Reminder = require('../models/reminder.js'),
    ReminderDate = require("../models/reminderDate.js"),
    processTime = require('../nlp/processTime.js'),
    UserManager = require("../userManager.js"),
    logger = require("../logger.js"),
    catchBlocks = require("../errorhandling.js").catchBlocks,
    errorCodes = require("../nlp/errorCodes.js"),
    { encodeHTMLEntities } = require("../botutils.js");

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

function addRemindersToUserFromUtterance(utterance, ctx) {
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
            replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
        }
    }
    else {
        let reminder = new Reminder(reminderText, new ReminderDate(reminderDates), userId);
        UserManager.addReminderForUser(userId, reminder);
        replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
    }
    return true;
}

function remindmeCallBack(ctx) {
    let userId = ctx.chat.id;
    let utterance = ctx.message.text;
    logger.info(`${ctx.chat.id}: COMMAND_REMINDME`);

    if (!UserManager.getUserTimezone(userId)) {
        return ctx.reply("You need to set a timezone first with /timezone").catch(catchBlocks);
    }
    if (utterance == '/remindme') {
        return ctx.reply('/remindme what? (/help)').catch(catchBlocks);
    }

    let success = addRemindersToUserFromUtterance(utterance, ctx);
    if(success) {
        // Log utterance so I can run tests on new NLP algos later
        logger.info(`${ctx.chat.id}: remindme REMINDER_VALID ${utterance}`);
    }
    else {
        logger.info(`${ctx.chat.id}: remindme REMINDER_INVALID ${utterance}`);
    }

    return;
}

function addToBot(bot) {
    const FRANCO_ARAB_VARIANTS = [
        'fakarny', 'fakrny', 'fkarny', 'fkrny',
        'fakarney', 'fakrney', 'fkraney', 'fkrney',
        'fakarni', 'fakrni', 'fkrani', 'fkrni',
        'fakarnei', 'fakrnei', 'fkrnaei', 'fkrnei',
    ];

    const ITALIAN_VARIANTS = [
        'ricordami',
    ];

    const VARIANTS = ['remind me', ...FRANCO_ARAB_VARIANTS, ...ITALIAN_VARIANTS];
    bot.hears(new RegExp(`(${VARIANTS.join("|")})(.*)`, 'i'), (ctx) => {
        ctx.message.text = `/remindme ${ctx.match[2]}`;
        remindmeCallBack(ctx);
    });

    const COMMANDS_VARIANTS = ['r', 'remindme',
        ...(FRANCO_ARAB_VARIANTS.filter(x => x.indexOf(" ") == -1)),
        ...(ITALIAN_VARIANTS.filter(x => x.indexOf(" ") == -1)),
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