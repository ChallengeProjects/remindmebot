const
    processTime = require('./processTime.js'),
    Reminder = require('./reminder.js'),
    UserManager = require("./userManager.js"),
    Telegraf = require('telegraf'),
    Extra = require('telegraf/extra'),
    Markup = require('telegraf/markup'),
    session = require('telegraf/session'),
    Stage = require('telegraf/stage'),
    Scene = require('telegraf/scenes/base'),
    config = require("./config.json"),
    moment = require("moment-timezone");

const EDIT_TIME_SCENE = new Scene('EDIT_TIME_SCENE');
EDIT_TIME_SCENE.enter(ctx => {
    ctx.reply("Ok enter your new time (or /cancel)", Extra.markup(Markup.forceReply()));
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

    UserManager.updateReminderDate(userId, reminderId, reminderDate, remindUser.bind(null, userId, reminder));
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

const bot = new Telegraf(config.botToken);
bot.use(session());
bot.use(stage.middleware());


const HELP_TEXT = `1- /timezone to set your timezone
2- /list to list all of your reminders
3- /help for help
4- /features for all the features of the bot
5- Use /remindme to make reminders.

General formula is: /remindme [date/time] to/that [anything].
<b>Don't forget the "to" or "that"</b>

<b>Examples:</b>
    • /remindme at 2 pm to do my homework
    • /remindme tomorrow at 5 pm to do my homework
    • /remindme in 5 minutes to check on the oven
    • /remindme on wednesday to pickup the kids from school
    • /remindme on january 5th that today is my birthday!
`;

function getReminderMarkup(reminder) {
    return Extra.HTML().markup((m) => {
        return m.inlineKeyboard([m.callbackButton("Edit", `EDIT_${reminder.getId()}`), m.callbackButton("Delete", `DELETE_${reminder.getId()}`)]);
    });
}

function remindUser(userId, reminder) {
    const SNOOZE_MAP = {
        "30S": 30*1000,
        '15M': 15*60*1000,
        "30M": 30*60*1000,
        "1H": 60*60*1000,
        "3H": 3*60*60*1000,
        "1D": 24*60*60*1000,
    };
    let markup = Extra.HTML().markup((m) => {
        return m.inlineKeyboard(Object.keys(SNOOZE_MAP).map(key => m.callbackButton(key.toLowerCase(), `SNOOZE_${SNOOZE_MAP[key]}_${reminder.getId()}`)));
    });
    bot.telegram.sendMessage(String(userId), reminder.getText() + '\n' + 'Remind me again in:', markup);
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
    UserManager.addUser(ctx.chat.id, ctx.chat.username);
    ctx.replyWithHTML('Hi there 👋! This is a simple bot that helps you remember things' + '\n' + HELP_TEXT);
});

bot.command('help', ctx => {
    ctx.replyWithHTML(HELP_TEXT);
});

bot.command('remindme', ctx => {
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
    } catch(err) {
        return ctx.reply("Sorry, I wasn't able to understand.\nCheck your spelling or try /help.");
    }
    
    let reminder = new Reminder(reminderText, reminderDate);
    
    UserManager.addReminderForUser(userId, reminder, remindUser.bind(null, userId, reminder));
    return replyWithConfirmation(ctx, reminder, ctx.update.message.message_id);
});

/**
 * snooze format is the following:
 * SNOOZE_<period in milliseconds>_<reminder id>
 */
bot.action(/SNOOZE_([^_]+)_([^_]+)/, ctx => {
    let userId = ctx.chat.id;
    let period = ctx.match[1];
    let reminderId = ctx.match[2];
    let reminder = UserManager.getReminder(userId, reminderId);

    let snoozedReminder = reminder.getSnoozedReminder(parseInt(period));
    UserManager.addReminderForUser(userId, snoozedReminder, remindUser.bind(null, userId, snoozedReminder));
    ctx.answerCbQuery();
    return replyWithConfirmation(ctx, snoozedReminder, null);
});

/**
 * delete format is the following:
 * DELETE_<reminder id>
 */
bot.action(/DELETE_([^_]+)/, ctx => {
    let reminderId = ctx.match[1];
    UserManager.deleteReminder(ctx.chat.id, reminderId);
    ctx.answerCbQuery();
    return ctx.reply("Reminder deleted");
});

/**
 * edit format is the following:
 * EDIT_<reminder id>
 */
bot.action(/EDIT_([^_]+)/, ctx => {
    let reminder = UserManager.getReminder(ctx.chat.id, ctx.match[1]);
    let markup = Extra.HTML().markup((m) => {
        return m.inlineKeyboard([m.callbackButton("Time", `EDIT-TIME_${reminder.getId()}`), m.callbackButton("Text", `EDIT-TEXT_${reminder.getId()}`)]);
    });
    ctx.answerCbQuery();
    return ctx.reply("Do you want to edit the time or the text?", markup);
});

bot.action(/EDIT-TIME_([^_]+)/, ctx => {
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("EDIT_TIME_SCENE");
    ctx.answerCbQuery();
});

bot.action(/EDIT-TEXT_([^_]+)/, ctx => {
    UserManager.setUserTemporaryStore(ctx.chat.id, ctx.match[1]);
    ctx.scene.enter("EDIT_TEXT_SCENE");
    ctx.answerCbQuery();
});

/**
 * view format is the following:
 * VIEW_<reminder id>
 */
bot.action(/VIEW_([^_]+)/, ctx => {
    let reminderId = ctx.match[1];
    let reminder = UserManager.getReminder(ctx.chat.id, reminderId);
    let timezone = UserManager.getUserTimezone(ctx.chat.id);

    let markup = getReminderMarkup(reminder);
    ctx.answerCbQuery();
    return ctx.reply(reminder.getFormattedReminder(timezone), markup);
});

bot.command('timezone', ctx => {
    let userId = ctx.chat.id;
    let timezone = ctx.message.text.split(" ")[1];
    if(!moment.tz.zone(timezone)) {
        return ctx.replyWithHTML(`You need to specify a valid timezone.

<b>Examples:</b>
• <code>/timezone America/Los_Angeles</code>
• <code>/timezone Africa/Cairo</code>
You can find your timezone with a map <a href="https://momentjs.com/timezone/">here</a>.`);
    }
    UserManager.setUserTimezone(userId, timezone);
    return ctx.reply("Ok your timezone now is " + timezone + ".");
});

bot.command('list', ctx => {
    let userId = ctx.chat.id;
    let reminders = UserManager.getUserSortedFutureReminders(userId);
    let timezone = UserManager.getUserTimezone(userId);
    let list = [];
    let i = 1;
    for(let reminder of reminders) {
        list.push(`<b>${i++})</b> ${reminder.getFormattedReminder(timezone)}`);
    }
    let markup = Extra.HTML().markup((m) => {
        let listOfButtons = [];
        let i = 1;
        for(let reminder of reminders) {
            listOfButtons.push(m.callbackButton(String(i++), `VIEW_${reminder.getId()}`));
        }
        // split into rows of 7s
        let listOfListOfButtons = [];
        let index = 0;
        while(index < listOfButtons.length) {
            listOfListOfButtons.push(listOfButtons.slice(index, index += 7));
        }

        return m.inlineKeyboard(listOfListOfButtons);
    });

    if(!list.length) {
        return ctx.reply("You have no reminders");
    }

    let body = list.join("\n------------\n");

    let footer = '\n\nChoose number to view or edit:';

    ctx.reply("These are your reminders:\n" + body + footer, markup);
});

bot.hears(/.*sahmudi.*/i, ctx => {
    ctx.reply("I love dodo ❤️😍");
});

bot.command('features', ctx => {
    ctx.replyWithHTML(`
        Other than the list of commands in /help.

        The bot lets you do more than that.

        It lets you:
        1- Snooze your reminders
        2- Edit them
    `);
});


function botStartup() {
    UserManager.getUsersFromStorage(remindUser);
}
botStartup();
bot.startPolling();