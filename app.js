const
    processTime = require('./processTime.js'),
    Reminder = require('./reminder.js'),
    UserManager = require("./userManager.js"),
    Extra = require('telegraf/extra'),
    Markup = require('telegraf/markup'),
    Stage = require('telegraf/stage'),
    Scene = require('telegraf/scenes/base'),
    moment = require("moment-timezone"),
    bot = require('./bot.js'),
    logger = require("./logger.js"),
    ReminderDate = require("./reminderDate.js");


function listToMatrix(list, n) {
    // split into rows of 7s
    let listOfLists = [];
    let index = 0;
    while(index < list.length) {
        listOfLists.push(list.slice(index, index += n));
    }
    return listOfLists;
}

const EDIT_TIME_SCENE = new Scene('EDIT_TIME_SCENE');
EDIT_TIME_SCENE.enter(ctx => {
    return ctx.reply("Ok enter your new time (or /cancel)", Extra.markup(Markup.forceReply()));
});
EDIT_TIME_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
    let utterance = "/remindme " + ctx.message.text + " to nothing";

    try {
        var {reminderDate} = processTime.getDate(utterance, UserManager.getUserTimezone(userId));
    } catch(err) {
        return ctx.reply("Sorry, I wasn't able to understand.\nCheck your spelling or try /help.");
    }
    UserManager.updateReminderDate(userId, reminderId, reminderDate);
    replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
    return ctx.scene.leave();
});
EDIT_TIME_SCENE.command('cancel', ctx => {
    return ctx.scene.leave();
});

const EDIT_TEXT_SCENE = new Scene('EDIT_TEXT_SCENE');
EDIT_TEXT_SCENE.enter(ctx => {
    ctx.reply("Ok enter your new text (or /cancel)", Extra.markup(Markup.forceReply()));
});
EDIT_TEXT_SCENE.on('text', ctx => {
    let userId = ctx.chat.id;
    let reminderId = UserManager.getUserTemporaryStore(userId);
    let reminder = UserManager.getReminder(userId, reminderId);
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

bot.use(stage.middleware());


const HELP_TEXT = `1- /timezone to set your timezone
2- /list to list all of your reminders
3- /help for help
4- Use /remindme to make reminders.

General formula is: /remindme [date/time] to/that [anything].
<b>Don't forget the "to" or "that"</b>

<b>Examples:</b>
    • /remindme at 2 pm to do my homework
    • /remindme tomorrow at 5 pm to do my homework
    • /remindme in 5 minutes to check on the oven
    • /remindme on wednesday to pickup the kids from school
    • /remindme on january 5th that today is my birthday!

<i>You can also do /r instead of /remindme</i>
`;

function getReminderMarkup(reminder) {
    return Extra.HTML().markup((m) => {
        let buttons = [
            m.callbackButton("Edit", `EDIT_${reminder.getId()}`),
            m.callbackButton("Delete", `DELETE_${reminder.getId()}`)
        ];
        if(reminder.isRecurring() && reminder.isEnabled()) {
            buttons.push(m.callbackButton("Disable", `DISABLE_${reminder.getId()}`));
        }
        else if(reminder.isRecurring && !reminder.isEnabled()) {
            buttons.push(m.callbackButton("Enable", `ENABLE_${reminder.getId()}`));
        }

        return m.inlineKeyboard(buttons);
    });
}

function replyWithConfirmation(ctx, reminder, replyToMessageId) {
    let timezone = UserManager.getUserTimezone(ctx.chat.id);
    let markup = getReminderMarkup(reminder);
    if(replyToMessageId) {
        markup.reply_to_message_id = replyToMessageId;
    }
    return ctx.reply('Alright I will remind you ' + reminder.getDateFormatted(timezone), markup);
}

bot.command('start', ctx => {
    logger.info(`${ctx.chat.id}: start`);
    UserManager.addUser(ctx.chat.id, ctx.chat.username);
    ctx.replyWithHTML('Hi there 👋! This is a simple bot that helps you remember things' + '\n' + HELP_TEXT);
});

bot.command('help', ctx => {
    logger.info(`${ctx.chat.id}: help`);
    ctx.replyWithHTML(HELP_TEXT);
});

let remindmeCallBack = (ctx) => {
    let userId = ctx.chat.id;
    let utterance = ctx.message.text;

    if(!UserManager.getUserTimezone(userId)) {
        return ctx.reply("You need to set a timezone first with /timezone");
    }
    if(utterance == '/remindme') {
        return ctx.reply('/remindme what?');
    }

    try {
        var {reminderText, reminderDate} = processTime.getDate(utterance, UserManager.getUserTimezone(userId));
        logger.info(`${ctx.chat.id}: remindme REMINDER_VALID`);
    } catch(err) {
        logger.info(`${ctx.chat.id}: remindme REMINDER_INVALID`);
        return ctx.reply("Sorry, I wasn't able to understand.\nCheck your spelling or try /help.");
    }
    
    let reminder = new Reminder(reminderText, new ReminderDate(reminderDate), userId);
    UserManager.addReminderForUser(userId, reminder);
    return replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
};

bot.command('remindme', remindmeCallBack);
bot.command('r', remindmeCallBack);

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
    UserManager.deleteReminder(ctx.chat.id, reminderId);
    ctx.answerCbQuery();
    return ctx.reply("Reminder deleted");
});

/**
 * view format is the following:
 * VIEW_<reminder id>
 */
bot.action(/VIEW_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminderId = ctx.match[1];
    let reminder = UserManager.getReminder(ctx.chat.id, reminderId);
    let timezone = UserManager.getUserTimezone(ctx.chat.id);

    let markup = getReminderMarkup(reminder);
    ctx.answerCbQuery();
    return ctx.reply(reminder.getFormattedReminder(timezone, false), markup);
});

bot.command('timezone', ctx => {
    let userId = ctx.chat.id;
    let timezone = ctx.message.text.split(" ")[1];

    if(!timezone || !moment.tz.zone(timezone)) {
        if(timezone && !moment.tz.zone(timezone)) {
            logger.info(`${ctx.chat.id}: timezone: TIMEZONE_INVALID:${timezone}`);
        }
        return ctx.replyWithHTML(`You need to specify a valid timezone.

<b>Examples:</b>
• <code>/timezone America/Los_Angeles</code>
• <code>/timezone Africa/Cairo</code>
You can find your timezone with a map <a href="https://momentjs.com/timezone/">here</a>.`);
    }
    logger.info(`${ctx.chat.id}: timezone: TIMEZONE_VALID:${timezone}`);
    UserManager.setUserTimezone(userId, timezone);
    return ctx.reply("Ok your timezone now is " + timezone + ".");
});

bot.command('list', ctx => {
    let userId = ctx.chat.id;
    let reminders = UserManager.getUserSortedFutureReminders(userId);
    logger.info(`${ctx.chat.id}: list, they have: ${reminders.length} reminders`);
    let timezone = UserManager.getUserTimezone(userId);
    let list = [];
    let i = 1;
    for(let reminder of reminders) {
        list.push(`<b>${i++})</b> ${reminder.getFormattedReminder(timezone, true)}`);
    }
    let markup = Extra.HTML().markup((m) => {
        let listOfButtons = [];
        let i = 1;
        for(let reminder of reminders) {
            listOfButtons.push(m.callbackButton(String(i++), `VIEW_${reminder.getId()}`));
        }

        return m.inlineKeyboard(listToMatrix(listOfButtons, 7));
    });

    if(!list.length) {
        return ctx.reply("You have no reminders");
    }

    let body = list.join("\n------------\n");

    let footer = '\n\nChoose number to view or edit:';

    ctx.reply("These are your reminders:\n" + body + footer, markup);
});

bot.command('about', ctx => {
    return ctx.replyWithHTML("This bot was created by @bubakazouba. The source code is available on <a href='https://github.com/bubakazouba/remindmebot'>Github</a>.\nContact me for feature requests!");
});

/**
 * edit format is the following:
 * EDIT_<reminder id>
 */
bot.action(/EDIT_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    let markup = Extra.HTML().markup((m) => {
        return m.inlineKeyboard([m.callbackButton("Time", `EDIT-TIME_${reminder.getId()}`), m.callbackButton("Text", `EDIT-TEXT_${reminder.getId()}`)]);
    });
    ctx.answerCbQuery();
    return ctx.reply("Do you want to edit the time or the text?", markup);
});

bot.action(/EDIT-TIME_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
    if(UserManager.getReminder(ctx.chat.id, ctx.match[1]).isRecurring()) {
        ctx.answerCbQuery();
        return ctx.reply("Sorry you cant edit time of recurring reminders");
    }
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("EDIT_TIME_SCENE");
    ctx.answerCbQuery();
});

bot.action(/EDIT-TEXT_([^_]+)/, ctx => {
    logger.info(`${ctx.chat.id}: ${ctx.match[0]}`);
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
    }
    else {
        UserManager.disableReminder(ctx.chat.id, ctx.match[2]);
    }
    ctx.answerCbQuery();
    return ctx.reply(`Reminder ${shouldEnable ? "enabled" : "disabled"}.`);
});

function botStartup() {
    UserManager.getUsersFromStorage();
}
botStartup();
bot.startPolling();