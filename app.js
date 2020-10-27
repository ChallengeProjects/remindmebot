const UserManager = require("./userManager.js"),
    Extra = require('telegraf/extra'),
    Markup = require('telegraf/markup'),
    Stage = require('telegraf/stage'),
    Scene = require('telegraf/scenes/base'),
    bot = require('./bot.js'),
    botutils = require('./botutils.js'),
    logger = require("./logger.js"),
    listcommand = require("./botfunctions/listcommand.js"),
    helpcommand = require("./botfunctions/helpcommand.js"),
    remindercommand = require("./botfunctions/remindercommand.js"),
    timezonecommand = require("./botfunctions/timezonecommand.js"),
    config = require("./"+process.env["config"])[process.env.NODE_ENV],
    constants = require("./utils/constants.js"),
    serverApp = require("./server.js");

const CUSTOM_SNOOZE_SCENE = new Scene('CUSTOM_SNOOZE_SCENE');
CUSTOM_SNOOZE_SCENE.enter(ctx => {
    return ctx.reply("Ok enter your new time (or /cancel)", Extra.markup(Markup.forceReply())).catch(UserManager.catchBlocks);
});

CUSTOM_SNOOZE_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    // looks like "/cancel" doesnt get captured in the command,
    //  make sure it's captured here
    if (ctx.message.text == "/cancel") {
        logger.info(`${ctx.chat.id}: CANCEL_CUSTOM_SNOOZE`);
        ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }
    // make sure reminder still exists
    if (!reminder) {
        ctx.reply("Looks like the reminder doesn't exist anymore, canceling transaction", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }

    let utterance =`/remindme ${ctx.message.text} to ${reminder.getText()}`;
    
    let success;
    try {
        success = remindercommand.addRemindersToUserFromUtterance(userId, utterance);
    } catch (err) {
        logger.info(`${ctx.chat.id}: CUSTOM_SNOOZE ${ctx.message.text} error was thrown: ${err}`);
        ctx.replyWithHTML(constants.USER_ERROR_MESSAGES.GENERIC_INVALID_REMINDER, Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }
    
    logger.info(`${ctx.chat.id}: CUSTOM_SNOOZE_${ success ? "" : "IN"}VALID ${ctx.message.text}`);

    return ctx.scene.leave();
});

CUSTOM_SNOOZE_SCENE.command('cancel', ctx => {
    logger.info(`${ctx.chat.id}: CANCEL_CUSTOM_SNOOZE`);
    ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
    return ctx.scene.leave();
});

const EDIT_TIME_SCENE = new Scene('EDIT_TIME_SCENE');
EDIT_TIME_SCENE.enter(ctx => {
    return ctx.reply("Ok enter your new time (or /cancel)", Extra.markup(Markup.forceReply())).catch(UserManager.catchBlocks);
});
EDIT_TIME_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    // looks like "/cancel" doesnt get captured in the command,
    //  make sure it's captured here
    if (ctx.message.text == "/cancel") {
        ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }
    // make sure reminder still exists
    if (!reminder) {
        ctx.reply("Looks like the reminder doesn't exist anymore, canceling transaction", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }
    let utterance = `/remindme ${ctx.message.text} to ${reminder.getText()}`;
    
    let remindersSet;
    try {
        remindersSet = remindercommand.addRemindersToUserFromUtterance(userId, utterance);
    } catch (err) {
        logger.info(`${ctx.chat.id}: EDIT_TIME ${ctx.message.text} error was thrown: ${err}`);
        ctx.replyWithHTML(constants.USER_ERROR_MESSAGES.GENERIC_INVALID_REMINDER, Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }

    if (!!remindersSet) {
        UserManager.deleteReminder(ctx.chat.id, reminderId);
    }
    logger.info(`${ctx.chat.id}: EDIT_TIME_${ !!remindersSet ? "" : "IN"}VALID ${ctx.message.text}`);   
    for (let reminderSet of remindersSet) {
        remindercommand.replyWithConfirmation(ctx, reminderSet, ctx.update.message.message_id);
    }
    
    return ctx.scene.leave();
});
EDIT_TIME_SCENE.command('cancel', ctx => {
    ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
    return ctx.scene.leave();
});

const EDIT_TEXT_SCENE = new Scene('EDIT_TEXT_SCENE');
EDIT_TEXT_SCENE.enter(ctx => {
    ctx.reply("Ok enter your new text (or /cancel)", Extra.markup(Markup.forceReply())).catch(UserManager.catchBlocks);
});
EDIT_TEXT_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    // looks like "/cancel" doesnt get captured in the .command listener
    if (ctx.message.text == "/cancel") {
        ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }
    // make sure reminder still exists
    if (!reminder) {
        ctx.reply("Looks like the reminder doesn't exist anymore, canceling transaction", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }
    UserManager.updateReminderText(userId, reminderId, ctx.message.text);
    remindercommand.replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
    return ctx.scene.leave();
});
EDIT_TEXT_SCENE.command('cancel', ctx => {
    ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
    return ctx.scene.leave();
});

const APPEND_LINE_SCENE = new Scene('APPEND_LINE_SCENE');
APPEND_LINE_SCENE.enter(ctx => {
    ctx.reply("Ok enter your new line (or /cancel)", Extra.markup(Markup.forceReply())).catch(UserManager.catchBlocks);
});
APPEND_LINE_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    // make sure reminder still exists
    // looks like "/cancel" doesnt get captured in the command,
    //  make sure it's captured here
    if (ctx.message.text == "/cancel") {
        ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }
    if (!reminder) {
        ctx.reply("Looks like the reminder doesn't exist anymore, canceling transaction", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
        return ctx.scene.leave();
    }
    let newText = reminder.getText() + '\n' + ctx.message.text;
    UserManager.updateReminderText(userId, reminderId, newText);
    remindercommand.replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
    return ctx.scene.leave();
});
APPEND_LINE_SCENE.command('cancel', ctx => {
    ctx.reply("Ok nvm!", Extra.markup(Markup.removeKeyboard(true))).catch(UserManager.catchBlocks);
    return ctx.scene.leave();
});

const stage = new Stage();
stage.register(EDIT_TEXT_SCENE);
stage.register(EDIT_TIME_SCENE);
stage.register(APPEND_LINE_SCENE);
stage.register(CUSTOM_SNOOZE_SCENE);

bot.use(stage.middleware());

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
        return ctx.editMessageText("<code>Reminder was already deleted.</code>", Extra.HTML().markup()).catch(UserManager.catchBlocks);
    }

    let snoozedReminder = reminder.getSnoozedReminder(parseInt(period));
    UserManager.addReminderForUser(userId, snoozedReminder);
    ctx.answerCbQuery();
    return remindercommand.replyWithConfirmation(ctx, snoozedReminder, null);
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
        return ctx.editMessageText("<code>Reminder was already deleted.</code>", Extra.HTML().markup()).catch(UserManager.catchBlocks);
    }
    let reminderText = reminder.getShortenedText(15);
    ctx.answerCbQuery();
    return ctx.editMessageText(`<code>✅ Reminder checked off: </code>"${reminderText}"`, Extra.HTML().markup()).catch(UserManager.catchBlocks);
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
        return ctx.editMessageText("<code>Reminder was already deleted.</code>", Extra.HTML().markup()).catch(UserManager.catchBlocks);
    }
    let reminderText = reminder.getShortenedText();
    UserManager.deleteReminder(ctx.chat.id, reminderId);
    ctx.answerCbQuery();
    return ctx.editMessageText(`<code>🗑️ Reminder deleted: </code>"${reminderText}"`, Extra.HTML().markup()).catch(UserManager.catchBlocks);
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

    let markup = remindercommand.getReminderMarkup(reminder);
    ctx.answerCbQuery();
    return ctx.reply(reminder.getFormattedReminder(false), markup).catch(UserManager.catchBlocks);
});


bot.action(/EDIT-TIME_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    if (!reminder) {
        return ctx.replyWithHTML("<code>Can't edit reminder. Reminder was deleted. </code>").catch(UserManager.catchBlocks);
    }
    if (reminder.isRecurring()) {
        ctx.answerCbQuery();
        return ctx.replyWithHTML("<code>Sorry you cant the edit time of recurring reminders</code>").catch(UserManager.catchBlocks);
    }
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("EDIT_TIME_SCENE");
    ctx.answerCbQuery();
});

bot.action(/EDIT-TEXT_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    if (!reminder) {
        return ctx.replyWithHTML("<code>Can't edit reminder. Reminder was deleted. </code>").catch(UserManager.catchBlocks);
    }
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("EDIT_TEXT_SCENE");
    ctx.answerCbQuery();
});

bot.action(/APPEND-LINE_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    if (!reminder) {
        return ctx.replyWithHTML("<code>Can't edit reminder. Reminder was deleted.</code>").catch(UserManager.catchBlocks);
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
        return ctx.reply("🔔 Reminder enabled.").catch(UserManager.catchBlocks);
    }
    else {
        UserManager.disableReminder(ctx.chat.id, ctx.match[2]);
        ctx.answerCbQuery();
        return ctx.reply("🔕 Reminder disabled.").catch(UserManager.catchBlocks);
    }
});

function botStartup() {
    const COMMANDS = [listcommand, helpcommand, remindercommand, timezonecommand];
    for(let c of COMMANDS) {
        c.addToBot(bot);
    }

    UserManager.loadUsersDataFromStorage(botutils.remindUser);
    const TIMEOUT = 30;
    const LIMIT = 100;
    const ALLOWED_UPDATES = [];
    const STOP_CALLBACK = () => {
        console.log("I stopped polling " + new Date());
    };
    bot.startPolling(TIMEOUT, LIMIT, ALLOWED_UPDATES, STOP_CALLBACK);
    UserManager.sendFeatureUpdates();

    // start the server
    const PORT = Number(config.port);
    var server = serverApp.listen(PORT, () => {
        var port = server.address().port;
        logger.info('Magic happens at ' + port);
    });
}

process.on('uncaughtException', function(err) {
    console.log("Uncaught Exception:", err);
    process.exit(1);
});

botStartup();