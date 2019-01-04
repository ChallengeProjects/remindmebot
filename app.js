const processTime = require('./processTime.js'),
    Reminder = require('./reminder.js'),
    UserManager = require("./userManager.js"),
    Extra = require('telegraf/extra'),
    Markup = require('telegraf/markup'),
    Stage = require('telegraf/stage'),
    Scene = require('telegraf/scenes/base'),
    moment = require("moment-timezone"),
    bot = require('./bot.js'),
    logger = require("./logger.js"),
    ReminderDate = require("./reminderDate.js"),
    listcommand = require("./botfunctions/listcommand.js"),
    helpcommand = require("./botfunctions/helpcommand.js"),
    catchBlocks = require("./errorhandling.js").catchBlocks,
    config = require("./config.json")[process.env.NODE_ENV],
    googleMapsClient = require('@google/maps').createClient({
        key: config.googleMapsClientKey
    });


const CUSTOM_SNOOZE_SCENE = new Scene('CUSTOM_SNOOZE_SCENE');
CUSTOM_SNOOZE_SCENE.enter(ctx => {
    return ctx.reply("Ok enter your new time (or /cancel)", Extra.markup(Markup.forceReply())).catch(catchBlocks);
});

CUSTOM_SNOOZE_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    // make sure reminder still exists
    if(!reminder) {
        return ctx.scene.leave();
    }
    let reminderText = reminder.getText();

    let utterance = "/remindme " + ctx.message.text + " to nothing";

    try {
        var {reminderDate} = processTime.getDate(utterance, UserManager.getUserTimezone(userId));
    } catch(err) {
        return ctx.reply("Sorry, I wasn't able to understand.\nCheck your spelling or try /help.").catch(catchBlocks);
    }
    let newReminder = new Reminder(reminderText, new ReminderDate(reminderDate), userId);
    UserManager.addReminderForUser(userId, newReminder);
    replyWithConfirmation(ctx, newReminder, null);
    return ctx.scene.leave();
});

CUSTOM_SNOOZE_SCENE.command('cancel', ctx => {
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
    if(!reminder) {
        return ctx.scene.leave();
    }
    let utterance = "/remindme " + ctx.message.text + " to nothing";

    try {
        var {reminderDate} = processTime.getDate(utterance, UserManager.getUserTimezone(userId));
    } catch(err) {
        return ctx.reply("Sorry, I wasn't able to understand.\nCheck your spelling or try /help.").catch(catchBlocks);
    }
    UserManager.updateReminderDate(userId, reminderId, new ReminderDate(reminderDate));
    replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
    return ctx.scene.leave();
});
EDIT_TIME_SCENE.command('cancel', ctx => {
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
    if(!reminder) {
        return ctx.scene.leave();
    }
    UserManager.updateReminderText(userId, reminderId, ctx.message.text);
    replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
    return ctx.scene.leave();
});
EDIT_TEXT_SCENE.command('cancel', ctx => {
    return ctx.scene.leave();
});

const stage = new Stage();
stage.register(EDIT_TEXT_SCENE);
stage.register(EDIT_TIME_SCENE);
stage.register(CUSTOM_SNOOZE_SCENE);

bot.use(stage.middleware());
listcommand.addToBot(bot);
helpcommand.addToBot(bot);

function getReminderMarkup(reminder) {
    return Extra.HTML().markup((m) => {
        let buttons = [
            m.callbackButton("✏️⏱", `EDIT-TIME_${reminder.getId()}`),
            m.callbackButton("✏️📖", `EDIT-TEXT_${reminder.getId()}`),
            m.callbackButton("🗑️", `DELETE_${reminder.getId()}`)
        ];
        if(reminder.isRecurring() && reminder.isEnabled()) {
            buttons.push(m.callbackButton("🚫", `DISABLE_${reminder.getId()}`));
        }
        else if(reminder.isRecurring() && !reminder.isEnabled()) {
            buttons.push(m.callbackButton("✅", `ENABLE_${reminder.getId()}`));
        }

        return m.inlineKeyboard(buttons);
    });
}

function replyWithConfirmation(ctx, reminder, replyToMessageId) {
    let markup = getReminderMarkup(reminder);
    if(replyToMessageId) {
        markup.reply_to_message_id = replyToMessageId;
    }
    let isRecurringText = reminder.isRecurring() ? "🔄⏱" : "⏱";
    return ctx.reply(`${isRecurringText} Alright I will remind you ${reminder.getDateFormatted()} to ${reminder.getShortenedText()}`, markup).catch(catchBlocks);
}

let remindmeCallBack = (ctx) => {
    let userId = ctx.chat.id;
    let utterance = ctx.message.text;

    if(!UserManager.getUserTimezone(userId)) {
        return ctx.reply("You need to set a timezone first with /timezone").catch(catchBlocks);
    }
    if(utterance == '/remindme') {
        return ctx.reply('/remindme what?').catch(catchBlocks);
    }

    try {
        var {reminderText, reminderDate} = processTime.getDate(utterance, UserManager.getUserTimezone(userId));
        logger.info(`${ctx.chat.id}: remindme REMINDER_VALID`);
    } catch(err) {
        logger.info(`${ctx.chat.id}: remindme REMINDER_INVALID ${utterance}`);
        return ctx.reply("Sorry, I wasn't able to understand.\nCheck your spelling or try /help.").catch(catchBlocks);
    }
    
    let reminder = new Reminder(reminderText, new ReminderDate(reminderDate), userId);
    UserManager.addReminderForUser(userId, reminder);
    return replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
};

bot.hears(/remind me(.*)/i, (ctx) => {
    ctx.message.text = `/remindme ${ctx.match[1]}`;
    remindmeCallBack(ctx);
});

bot.command('remindme', remindmeCallBack);
bot.command('r', remindmeCallBack);

bot.action(/CUSTOM_SNOOZE_([^_]+)/, ctx => {
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
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
    let reminder = UserManager.getReminder(userId, reminderId);

    let snoozedReminder = reminder.getSnoozedReminder(parseInt(period));
    UserManager.addReminderForUser(userId, snoozedReminder);
    ctx.answerCbQuery();
    return replyWithConfirmation(ctx, snoozedReminder, null);
});

/**
 * delete format is the following:
 * DELETE_<reminder id>
 */
bot.action(/DELETE_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminderId = ctx.match[1];
    let reminder = UserManager.getReminder(ctx.chat.id, reminderId);
    if(!reminder) {
        return ctx.editMessageText("Reminder was already deleted.").catch(catchBlocks);
    }
    let reminderText = reminder.getShortenedText();
    UserManager.deleteReminder(ctx.chat.id, reminderId);
    ctx.answerCbQuery();
    return ctx.editMessageText(`🗑️ Reminder deleted: "${reminderText}"`).catch(catchBlocks);
});

/**
 * view format is the following:
 * VIEW_<reminder id>
 */
bot.action(/VIEW_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminderId = ctx.match[1];
    let reminder = UserManager.getReminder(ctx.chat.id, reminderId);
    if(!reminder) {
        return ctx.answerCbQuery();
    }

    let markup = getReminderMarkup(reminder);
    ctx.answerCbQuery();
    return ctx.reply(reminder.getFormattedReminder(false), markup).catch(catchBlocks);
});

bot.on('location', (ctx) => {
    const userId = ctx.from.id;
    const userLatitude = Number(ctx.message.location.latitude);
    const userLongitude = Number(ctx.message.location.longitude);

    convertCoordinatesToTimezone(userLatitude, userLongitude).then(timezoneId => {
        UserManager.setUserTimezone(userId, timezoneId);
        if (timezoneId) {
            ctx.reply(`Your timezone has been set to ${timezoneId}. You can now start setting reminders!`);
        } else {
            ctx.reply("Something went wrong. Please try again at a later time");
        }
    })
})

function convertCoordinatesToTimezone(latitude, longitude) {
    let timestamp = Math.floor(Date.now() / 1000);

    return new Promise((resolve, reject) => {
        googleMapsClient.timezone({
            location: [latitude, longitude],
            timestamp: timestamp,
            language: 'en'
        }, (err, res) => {
            if (!err) {
                resolve(res.json.timeZoneId);
            } else {
                logger.info("google maps error:", err);
                reject(null);
            }
        });
    });
}


bot.command('timezone', ctx => {
    let userId = ctx.chat.id;
    let timezone = ctx.message.text.split(" ")[1];

    if(!timezone || !moment.tz.zone(timezone)) {
        if(timezone) {
            logger.info(`${ctx.chat.id}: timezone: TIMEZONE_INVALID:${timezone}`);
        }
        return ctx.replyWithHTML(`You need to specify a valid timezone.
You can do this by either sending me your location 📍 or by using the /timezone command:

<b>Examples:</b>
• <code>/timezone America/Los_Angeles</code>
• <code>/timezone Africa/Cairo</code>
You can find your timezone with a map <a href="https://momentjs.com/timezone/">here</a>.`).catch(catchBlocks);
    }
    logger.info(`${ctx.chat.id}: timezone: TIMEZONE_VALID:${timezone}`);
    UserManager.setUserTimezone(userId, timezone);
    return ctx.reply("Ok your timezone now is " + timezone + ". You can now start setting reminders!").catch(catchBlocks);
});

bot.action(/EDIT-TIME_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    if(!reminder) {
        return ctx.reply("Can't edit reminder. Reminder was deleted").catch(catchBlocks);
    }
    if(reminder.isRecurring()) {
        ctx.answerCbQuery();
        return ctx.reply("Sorry you cant edit time of recurring reminders").catch(catchBlocks);
    }
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("EDIT_TIME_SCENE");
    ctx.answerCbQuery();
});

bot.action(/EDIT-TEXT_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    if(!reminder) {
        return ctx.reply("Can't edit reminder. Reminder was deleted").catch(catchBlocks);
    }
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("EDIT_TEXT_SCENE");
    ctx.answerCbQuery();
});

/**
 * edit format is the following:
 * (DISABLE|ENABLE)_<reminder id>
 */
bot.action(/(DISABLE|ENABLE)_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);

    let shouldEnable = ctx.match[1] == "ENABLE";
    if(shouldEnable) {
        UserManager.enableReminder(ctx.chat.id, ctx.match[2]);
        ctx.answerCbQuery();
        return ctx.reply("✅ Reminder enabled.").catch(catchBlocks);
    }
    else {
        UserManager.disableReminder(ctx.chat.id, ctx.match[2]);
        ctx.answerCbQuery();
        return ctx.reply("🚫 Reminder disabled.").catch(catchBlocks);
    }
});


function botStartup() {
    UserManager.loadUsersDataFromStorage();
    bot.startPolling();
    UserManager.sendFeatureUpdates();
}

botStartup();