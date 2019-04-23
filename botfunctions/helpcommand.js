const logger = require("../logger.js"),
    UserManager = require("../userManager.js"),
    catchBlocks = require("../errorhandling.js").catchBlocks;


const HELP_TEXT = `Feel free to contact me @bubakazouba if you would like to see anything else in the bot!

1- /timezone to set your timezone
2- /list to list all of your reminders
    * You can do "/list work" to only list reminders the contain the word "work"
3- /help for help
4- Use /remindme to make reminders.

General formula is: /remindme [date/time] to/that [anything].
<b>Don't forget the "to" or "that"</b>

<b>Examples:</b>
    • /remindme at 2 pm to do my homework
    • /remindme tomorrow at 5 pm to do my homework
    • /r in five minutes to check on the oven
    • /remindme on wednesday to pickup the kids from school
    • remind me on january 5th that today is my birthday!

You can also make recurring reminders: /help_with_recurring_reminders

<b>Edit Reminder Time</b>: ✏️⏱
<b>Edit Reminder Text</b>: ✏️📖
<b>Delete Reminder</b>: 🗑️
<b>Enable Reminder</b>: 🔔
<b>Disable Reminder</b>: 🔕
<b>Check off Reminder</b>: ✅
`;

const HELP_WITH_RECURRING_REMINDERS_TEXT = `To setup recurring reminders:
/remindme every day at 9 am and 9 pm to take my medicine
/remindme every sunday at 10 am to do my laundry
/remindme every monday,wednesday,friday at 5 pm to leave at 6 from work to pick up the kids
/remindme every 2 hours to check my email

keyword is <b>every</b>`;

const ABOUT_TEXT = `This bot was created by @bubakazouba. The source code is available on <a href='https://github.com/bubakazouba/remindmebot'>Github</a>.\nContact me for feature requests or bug reports!`;

function addToBot(bot) {
    bot.command('help', ctx => {
        logger.info(`${ctx.chat.id}: help`);
        return ctx.replyWithHTML(HELP_TEXT).catch(catchBlocks);
    });

    bot.command('help_with_recurring_reminders', ctx => {
        return ctx.replyWithHTML(HELP_WITH_RECURRING_REMINDERS_TEXT).catch(catchBlocks);
    });

    bot.command('start', ctx => {
        logger.info(`${ctx.chat.id}: start`);
        UserManager.addUser(ctx.chat.id, ctx.chat.username);
        return ctx.replyWithHTML('Hi there 👋! This is a simple bot that helps you remember things' + '\n' + HELP_TEXT).catch(catchBlocks);
    });

    bot.command('about', ctx => {
        return ctx.replyWithHTML(ABOUT_TEXT).catch(catchBlocks);
    });
}

module.exports = {
    addToBot: addToBot
};