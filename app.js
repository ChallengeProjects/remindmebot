const UserManager = require("./userManager.js"),
    Extra = require('telegraf/extra'),
    Markup = require('telegraf/markup'),
    Stage = require('telegraf/stage'),
    Scene = require('telegraf/scenes/base'),
    bot = require('./bot.js'),
    logger = require("./logger.js"),
    listcommand = require("./botfunctions/listcommand.js"),
    helpcommand = require("./botfunctions/helpcommand.js"),
    remindercommand = require("./botfunctions/remindercommand.js"),
    timezonecommand = require("./botfunctions/timezonecommand.js"),
    catchBlocks = require("./errorhandling.js").catchBlocks,
    { encodeHTMLEntities } = require("./botutils.js"),
    config = require("./config.json")[process.env.NODE_ENV];

/////////////////////////////////////////////////////////
// small hack to set reminders through a RESTful API
const express = require('express'),
    bodyParser = require('body-parser');

let app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.post('/remindme', function(req, res) {
    if (config.botToken != req.body.botToken) {
        return;
    }
    logger.info("req.body=" + JSON.stringify(req.body));
    let ctx = {
        message: {
            text: req.body.text
        },
        chat: {
            id: req.body.chatid
        },
        reply: function(text) {
            logger.info("RESTFUL_API: going to reply with: " + text);
            res.send(text);
            return { catch: function() {} };
        },
        update: {
            message: {
                message_id: 3 // number doesnt matter, just keep the structure intact
            }
        }
    };
    remindercommand.remindmeCallBack(ctx);
});

/////////////////////////////////////////////////////////


const CUSTOM_SNOOZE_SCENE = new Scene('CUSTOM_SNOOZE_SCENE');
CUSTOM_SNOOZE_SCENE.enter(ctx => {
    return ctx.reply("Ok enter your new time (or /cancel)", Extra.markup(Markup.forceReply())).catch(catchBlocks);
});

CUSTOM_SNOOZE_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    // make sure reminder still exists
    // looks like "/cancel" doesnt get captured in the command,
    //  make sure it's captured here
    if (ctx.message.text == "/cancel") {
        logger.info(`${ctx.chat.id}: CANCEL_CUSTOM_SNOOZE`);
        ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
        return ctx.scene.leave();
    }
    if (!reminder) {
        ctx.reply("Looks like the reminder doesn't exist anymore, canceling transaction", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
        return ctx.scene.leave();
    }

    let utterance =`/remindme ${ctx.message.text} to ${reminder.getText()}`;
    
    let success = remindercommand.addRemindersToUserFromUtterance(utterance, ctx, replyWithConfirmation);
    logger.info(`${ctx.chat.id}: CUSTOM_SNOOZE_${ success ? "" : "IN"}VALID ${ctx.message.text}`);   

    return ctx.scene.leave();
});

CUSTOM_SNOOZE_SCENE.command('cancel', ctx => {
    logger.info(`${ctx.chat.id}: CANCEL_CUSTOM_SNOOZE`);
    ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
    return ctx.scene.leave();
});

const EDIT_TIME_SCENE = new Scene('EDIT_TIME_SCENE');
EDIT_TIME_SCENE.enter(ctx => {
    return ctx.reply("Ok enter your new time (or /cancel)", Extra.markup(Markup.forceReply())).catch(catchBlocks);
});
EDIT_TIME_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    // make sure reminder still exists
    // looks like "/cancel" doesnt get captured in the command,
    //  make sure it's captured here
    if (ctx.message.text == "/cancel") {
        ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
        return ctx.scene.leave();
    }
    if (!reminder) {
        ctx.reply("Looks like the reminder doesn't exist anymore, canceling transaction", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
        return ctx.scene.leave();
    }
    let utterance = `/remindme ${ctx.message.text} to ${reminder.getText()}`;
    let success = remindercommand.addRemindersToUserFromUtterance(utterance, ctx, replyWithConfirmation);
    if (success) {
        UserManager.deleteReminder(ctx.chat.id, reminderId);
    }
    logger.info(`${ctx.chat.id}: EDIT_TIME_${ success ? "" : "IN"}VALID ${ctx.message.text}`);   
    
    return ctx.scene.leave();
});
EDIT_TIME_SCENE.command('cancel', ctx => {
    ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
    return ctx.scene.leave();
});

const EDIT_TEXT_SCENE = new Scene('EDIT_TEXT_SCENE');
EDIT_TEXT_SCENE.enter(ctx => {
    ctx.reply("Ok enter your new text (or /cancel)", Extra.markup(Markup.forceReply())).catch(catchBlocks);
});
EDIT_TEXT_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    // make sure reminder still exists
    // looks like "/cancel" doesnt get captured in the .command listener
    if (ctx.message.text == "/cancel") {
        ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
        return ctx.scene.leave();
    }
    if (!reminder) {
        ctx.reply("Looks like the reminder doesn't exist anymore, canceling transaction", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
        return ctx.scene.leave();
    }
    UserManager.updateReminderText(userId, reminderId, ctx.message.text);
    replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
    return ctx.scene.leave();
});
EDIT_TEXT_SCENE.command('cancel', ctx => {
    ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
    return ctx.scene.leave();
});

const APPEND_LINE_SCENE = new Scene('APPEND_LINE_SCENE');
APPEND_LINE_SCENE.enter(ctx => {
    ctx.reply("Ok enter your new line (or /cancel)", Extra.markup(Markup.forceReply())).catch(catchBlocks);
});
APPEND_LINE_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    // make sure reminder still exists
    // looks like "/cancel" doesnt get captured in the command,
    //  make sure it's captured here
    if (ctx.message.text == "/cancel") {
        ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
        return ctx.scene.leave();
    }
    if (!reminder) {
        ctx.reply("Looks like the reminder doesn't exist anymore, canceling transaction", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
        return ctx.scene.leave();
    }
    let newText = reminder.getText() + '\n' + ctx.message.text;
    UserManager.updateReminderText(userId, reminderId, newText);
    replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
    return ctx.scene.leave();
});
APPEND_LINE_SCENE.command('cancel', ctx => {
    ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(catchBlocks);
    return ctx.scene.leave();
});

const stage = new Stage();
stage.register(EDIT_TEXT_SCENE);
stage.register(EDIT_TIME_SCENE);
stage.register(APPEND_LINE_SCENE);
stage.register(CUSTOM_SNOOZE_SCENE);

bot.use(stage.middleware());

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

bot.action(/CUSTOM_SNOOZE_([^_]+)/, ctx => {
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    logger.info(`${ctx.chat.id}: COMMAND_CUSTOM_SNOOZE`);
    ctx.scene.enter("CUSTOM_SNOOZE_SCENE");
    ctx.answerCbQuery();
});
/**
 * snooze format is the following:
 * SNOOZE_<period in milliseconds>_<reminder id>
 */
bot.action(/SNOOZE_([^_]+)_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let userId = ctx.chat.id;
    let period = ctx.match[1];
    let reminderId = ctx.match[2];
    logger.info(`${ctx.chat.id}: COMMAND_PRESET_SNOOZE_${period}`);
    let reminder = UserManager.getReminder(userId, reminderId);
    if (!reminder) {
        return ctx.editMessageText("<code>Reminder was already deleted.</code>", Extra.HTML().markup()).catch(catchBlocks);
    }

    let snoozedReminder = reminder.getSnoozedReminder(parseInt(period));
    UserManager.addReminderForUser(userId, snoozedReminder);
    ctx.answerCbQuery();
    return replyWithConfirmation(ctx, snoozedReminder, null);
});
/**
 * delete format is the following:
 * DELETE_<reminder id>
 */
bot.action(/CHECK_OFF_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminderId = ctx.match[1];
    let reminder = UserManager.getReminder(ctx.chat.id, reminderId);
    if (!reminder) {
        return ctx.editMessageText("<code>Reminder was already deleted.</code>", Extra.HTML().markup()).catch(catchBlocks);
    }
    let reminderText = reminder.getShortenedText(15);
    ctx.answerCbQuery();
    return ctx.editMessageText(`<code>✅ Reminder checked off: </code>"${reminderText}"`, Extra.HTML().markup()).catch(catchBlocks);
});

/**
 * delete format is the following:
 * DELETE_<reminder id>
 */
bot.action(/DELETE_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminderId = ctx.match[1];
    let reminder = UserManager.getReminder(ctx.chat.id, reminderId);
    if (!reminder) {
        return ctx.editMessageText("<code>Reminder was already deleted.</code>", Extra.HTML().markup()).catch(catchBlocks);
    }
    let reminderText = reminder.getShortenedText();
    UserManager.deleteReminder(ctx.chat.id, reminderId);
    ctx.answerCbQuery();
    return ctx.editMessageText(`<code>🗑️ Reminder deleted: </code>"${reminderText}"`, Extra.HTML().markup()).catch(catchBlocks);
});

/**
 * view format is the following:
 * VIEW_<reminder id>
 */
bot.action(/VIEW_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminderId = ctx.match[1];
    let reminder = UserManager.getReminder(ctx.chat.id, reminderId);
    if (!reminder) {
        return ctx.answerCbQuery();
    }

    let markup = getReminderMarkup(reminder);
    ctx.answerCbQuery();
    return ctx.reply(reminder.getFormattedReminder(false), markup).catch(catchBlocks);
});


bot.action(/EDIT-TIME_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    if (!reminder) {
        return ctx.replyWithHTML("<code>Can't edit reminder. Reminder was deleted. </code>").catch(catchBlocks);
    }
    if (reminder.isRecurring()) {
        ctx.answerCbQuery();
        return ctx.replyWithHTML("<code>Sorry you cant the edit time of recurring reminders</code>").catch(catchBlocks);
    }
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("EDIT_TIME_SCENE");
    ctx.answerCbQuery();
});

bot.action(/EDIT-TEXT_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    if (!reminder) {
        return ctx.replyWithHTML("<code>Can't edit reminder. Reminder was deleted. </code>").catch(catchBlocks);
    }
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("EDIT_TEXT_SCENE");
    ctx.answerCbQuery();
});

bot.action(/APPEND-LINE_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    if (!reminder) {
        return ctx.replyWithHTML("<code>Can't edit reminder. Reminder was deleted.</code>").catch(catchBlocks);
    }
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("APPEND_LINE_SCENE");
    ctx.answerCbQuery();
});

/**
 * edit format is the following:
 * (DISABLE|ENABLE)_<reminder id>
 */
bot.action(/(DISABLE|ENABLE)_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);

    let shouldEnable = ctx.match[1] == "ENABLE";
    if (shouldEnable) {
        UserManager.enableReminder(ctx.chat.id, ctx.match[2]);
        ctx.answerCbQuery();
        return ctx.reply("🔔 Reminder enabled.").catch(catchBlocks);
    }
    else {
        UserManager.disableReminder(ctx.chat.id, ctx.match[2]);
        ctx.answerCbQuery();
        return ctx.reply("🔕 Reminder disabled.").catch(catchBlocks);
    }
});

function botStartup() {
    listcommand.addToBot(bot);
    helpcommand.addToBot(bot);
    remindercommand.addToBot(bot, replyWithConfirmation);
    timezonecommand.addToBot(bot);

    UserManager.loadUsersDataFromStorage();
    bot.startPolling();
    UserManager.sendFeatureUpdates();

    // start the server
    const PORT = Number(config.port);
    var server = app.listen(PORT, () => {
        var port = server.address().port;
        logger.info('Magic happens at ' + port);
    });
}

process.on('uncaughtException', function(err) {
    console.log("Uncaught Exception:", err);
    process.exit(1);
});

botStartup();