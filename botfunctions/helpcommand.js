const logger = require("../logger.js");


const HELP_TEXT = `1- /timezone to set your timezone
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
`;

const HELP_WITH_RECURRING_REMINDERS_TEXT = `To setup recurring reminders:
/remindme every day at 9 am and 9 pm to take my medicine
/remindme every sunday at 10 am to do my laundry
/remindme every monday,wednesday,friday at 5 pm to leave at 6 from work to pick up the kids
/remindme every 2 hours to check my email

keyword is <b>every</b>`;

function addToBot(bot) {
    bot.command('help', ctx => {
        logger.info(`${ctx.chat.id}: help`);
        return ctx.replyWithHTML(HELP_TEXT);
    });

    bot.command('help_with_recurring_reminders', ctx=> {
        return ctx.replyWithHTML(HELP_WITH_RECURRING_REMINDERS_TEXT);
    });

    bot.command('start', ctx => {
        logger.info(`${ctx.chat.id}: start`);
        UserManager.addUser(ctx.chat.id, ctx.chat.username);
        return ctx.replyWithHTML('Hi there 👋! This is a simple bot that helps you remember things' + '\n' + HELP_TEXT);
    });

    bot.command('about', ctx => {
        return ctx.replyWithHTML("This bot was created by @bubakazouba. The source code is available on <a href='https://github.com/bubakazouba/remindmebot'>Github</a>.\nContact me for feature requests or bug reports!");
    });
}

module.exports = {
    addToBot: addToBot
};