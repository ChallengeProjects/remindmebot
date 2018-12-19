const UserManager = require("../userManager.js"),
    logger = require("../logger.js"),
    Extra = require('telegraf/extra');

function _listToMatrix(list, n) {
    // split into rows of 7s
    let listOfLists = [];
    let index = 0;
    while(index < list.length) {
        listOfLists.push(list.slice(index, index += n));
    }
    return listOfLists;
}

/**
    searchTerm is optional
    pageNumber starts from 1
    isFirstInTransaction - is this the first /list command (i.e cant edit message text)
*/
function _displayList(ctx, userId, searchTerm, pageNumber, isRecurring, isFirstInTransaction) {
    const NUMBER_OF_REMINDERS_PER_PAGE = 7;
    pageNumber = Number(pageNumber);
    if(!searchTerm) {
        searchTerm = "";
    }

    let allRecurringReminders = UserManager.getUserSortedFutureReminders(userId, searchTerm, true);
    let allNoneRecurringReminders = UserManager.getUserSortedFutureReminders(userId, searchTerm, false);
    let nRecurring, nNoneRecurring;
    nRecurring = allRecurringReminders.length;
    nNoneRecurring = allNoneRecurringReminders.length;
    let allReminders = isRecurring ? allRecurringReminders : allNoneRecurringReminders;

    if(!allReminders) {
        return ctx.reply("You need to /start first");
    }
    let reminders;
    if(allReminders.length == 0) {
        pageNumber = 0;
        reminders = [];
    }
    else {
        let remindersMatrix = _listToMatrix(allReminders, NUMBER_OF_REMINDERS_PER_PAGE);
        if(pageNumber > remindersMatrix.length) {
            pageNumber = remindersMatrix.length;
        }
        reminders = remindersMatrix[pageNumber - 1];
    }
    

    logger.info(`${userId}: list, isRecurring:${isRecurring} ${searchTerm},${reminders.length} reminders`);

    let markup = Extra.HTML().markup((m) => {
        let reminderButtons = [];
        let i = (pageNumber - 1) * NUMBER_OF_REMINDERS_PER_PAGE + 1;
        for(let reminder of reminders) {
            reminderButtons.push(m.callbackButton(String(i++), `VIEW_${reminder.getId()}`));
        }

        let b64EncodedSearchTerm = Buffer.from(searchTerm).toString('base64');

        let paginationButtons = [];
        if(pageNumber > 1) {
            paginationButtons.push(m.callbackButton(`Page ${pageNumber - 1} «`, `LIST${isRecurring ? "" : "_NON"}_RECURRING_${pageNumber - 1}_${b64EncodedSearchTerm}`));
        }

        paginationButtons.push(m.callbackButton(`${isRecurring ? nNoneRecurring + " ⏱" : nRecurring + " 🔄⏱"}`, `LIST${isRecurring ? "_NON" : ""}_RECURRING_1_${b64EncodedSearchTerm}`));

        if(pageNumber < Math.ceil(allReminders.length / NUMBER_OF_REMINDERS_PER_PAGE)) {
            paginationButtons.push(m.callbackButton(`Page ${pageNumber + 1} »`, `LIST${isRecurring ? "" : "_NON"}_RECURRING_${pageNumber + 1}_${b64EncodedSearchTerm}`));
        }
        
        return m.inlineKeyboard([reminderButtons, paginationButtons]);
    });

    let remindersList = [];
    let i = (pageNumber - 1) * NUMBER_OF_REMINDERS_PER_PAGE + 1;
    for(let reminder of reminders) {
        remindersList.push(`<b>${i++})</b> ${reminder.getFormattedReminder(true)}`);
    }

    if(!remindersList.length) {
        let noRemindersMessage = `You have no ${isRecurring ? "🔄⏱" : "⏱"} reminders ${searchTerm.length != 0 ? "with the search query: " + searchTerm : ""}`;
        if(isFirstInTransaction) {
            return ctx.reply(noRemindersMessage, markup);
        }
        else {
            return ctx.editMessageText(noRemindersMessage, markup);
        }
    }

    let body = remindersList.join("\n——————————————\n");

    let footer = '\n\nChoose number to view or edit:';

    let header = `You have ${isRecurring ? nRecurring + " 🔄⏱" : nNoneRecurring + " ⏱"} reminders:` + "\n"
        + (searchTerm.length != 0 ? `Search query: ${searchTerm}` : "") + "\n\n";

    if(isFirstInTransaction) {
        return ctx.reply(header + body + footer, markup);
    }
    else {
        return ctx.editMessageText(header + body + footer, markup);
    }
}

function addToBot(bot) {
    bot.action(/LIST_NON_RECURRING_([0-9]+)_([^_]*)/, ctx => {
        let userId = ctx.chat.id;
        let pageNumber = ctx.match[1];
        let b64EncodedSearchTerm = ctx.match[2];
        let searchTerm = Buffer.from(b64EncodedSearchTerm, 'base64').toString('ascii');
        _displayList(ctx, userId, searchTerm, pageNumber, false, false);

    });

    bot.action(/LIST_RECURRING_([0-9]+)_([^_]*)/, ctx => {
        let userId = ctx.chat.id;
        let pageNumber = ctx.match[1];
        let b64EncodedSearchTerm = ctx.match[2];
        let searchTerm = Buffer.from(b64EncodedSearchTerm, 'base64').toString('ascii');
        _displayList(ctx, userId, searchTerm, pageNumber, true, false);
    });

    bot.command('list', ctx => {
        let userId = ctx.chat.id;
        let searchTerm = ctx.message.text.split(" ")[1];
        let pageNumber = 1;
        _displayList(ctx, userId, searchTerm, pageNumber, false, true);
    });
}

module.exports = {
    addToBot: addToBot
};