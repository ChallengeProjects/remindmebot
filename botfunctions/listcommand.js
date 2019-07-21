const UserManager = require("../userManager.js"),
    logger = require("../logger.js"),
    remindercommand = require("./remindercommand.js"),
    catchBlocks = require("../errorhandling.js").catchBlocks,
    Extra = require('telegraf/extra');

const NUMBER_OF_REMINDERS_PER_PAGE = 7;

function _listToMatrix(list, n) {
    // split into rows of 7s
    let listOfLists = [];
    let index = 0;
    while (index < list.length) {
        listOfLists.push(list.slice(index, index += n));
    }
    return listOfLists;
}

function _displayOneReminderToTheUser(ctx, allReminders, allRecurringReminders, allNoneRecurringReminders, searchTerm, b64EncodedSearchTerm, isRecurring, nRecurring, nNoneRecurring) {
    let reminder = allReminders[0];
    let markup = remindercommand.getReminderMarkup(reminder);
    let onlyOneReminder = allRecurringReminders.length + allNoneRecurringReminders.length == 1;
    let headerText;

    // Dont specify ⏱/🔄⏱ if the user only has one reminder TOTAL
    if(onlyOneReminder) {
        headerText = `You only have the following reminder ${searchTerm.length != 0 ? `with the search query '${searchTerm}'` : ""}:`;
    }
    else  {
        headerText = `You only have the following ${isRecurring ? "🔄⏱" : "⏱"} reminder ${searchTerm.length != 0 ? `with the search query '${searchTerm}'` : ""}:`;
        let toggleRecurringButton;
        if(isRecurring) {
            toggleRecurringButton = {
                text: `${nNoneRecurring + " ⏱"}`,
                callback_data: `LIST_NON_RECURRING_1_${b64EncodedSearchTerm}`,
                hide: false
            };
        }
        else {
            toggleRecurringButton = {
                text: `${nRecurring + " 🔄⏱"}`,
                callback_data: `LIST_RECURRING_1_${b64EncodedSearchTerm}`,
                hide: false
            };
        }
        markup.reply_markup.inline_keyboard.push([toggleRecurringButton]);
    }
    
    let text = headerText + '\n\n' + reminder.getFormattedReminder(false);
    return ctx.reply(text, markup).catch(catchBlocks);
}

function _getReminderButtonsMarkup(allReminders, currentPageReminders, pageNumber, b64EncodedSearchTerm, isRecurring, nRecurring, nNoneRecurring) {
    return Extra.HTML().markup((m) => {
        let reminderButtons = [];
        let i = (pageNumber - 1) * NUMBER_OF_REMINDERS_PER_PAGE + 1;
        for (let reminder of currentPageReminders) {
            reminderButtons.push(m.callbackButton(String(i++), `VIEW_${reminder.getId()}`));
        }

        let paginationButtons = [];
        if (pageNumber > 1) {
            paginationButtons.push(m.callbackButton(`Page ${pageNumber - 1} «`, `LIST${isRecurring ? "" : "_NON"}_RECURRING_${pageNumber - 1}_${b64EncodedSearchTerm}`));
        }

        // add the switch button from recurring to non recurring
        //  only if there are non recurring reminders
        if (isRecurring && nNoneRecurring != 0) {
            paginationButtons.push(m.callbackButton(`${nNoneRecurring + " ⏱"}`, `LIST_NON_RECURRING_1_${b64EncodedSearchTerm}`));    
        }
        // add the switch button from non recurring to recurring
        //  only if there are recurring reminders
        else if (!isRecurring && nRecurring != 0) {
            paginationButtons.push(m.callbackButton(`${nRecurring + " 🔄⏱"}`, `LIST_RECURRING_1_${b64EncodedSearchTerm}`));
        }

        if (pageNumber < Math.ceil(allReminders.length / NUMBER_OF_REMINDERS_PER_PAGE)) {
            paginationButtons.push(m.callbackButton(`Page ${pageNumber + 1} »`, `LIST${isRecurring ? "" : "_NON"}_RECURRING_${pageNumber + 1}_${b64EncodedSearchTerm}`));
        }

        return m.inlineKeyboard([reminderButtons, paginationButtons]);
    });
}

/**
    searchTerm is optional
    pageNumber starts from 1
    isRecurring can be specified as true,false or non specified as null/undefined
    isFirstInTransaction - is this the first /list command (i.e cant edit message text)
*/
function _displayList(ctx, userId, searchTerm, pageNumber, isRecurring, isFirstInTransaction) {
    pageNumber = Number(pageNumber);
    if (!searchTerm) {
        searchTerm = "";
    }
    else {
        logger.info(`${ctx.chat.id}: COMMAND_LIST_SEARCH_TERM`);
    }
    let b64EncodedSearchTerm = Buffer.from(searchTerm).toString('base64');

    let allRecurringReminders = UserManager.getUserSortedFutureReminders(userId, searchTerm, true);
    let allNoneRecurringReminders = UserManager.getUserSortedFutureReminders(userId, searchTerm, false);
    if (allRecurringReminders == undefined || allNoneRecurringReminders == undefined) {
        return;
    }
    let nRecurring, nNoneRecurring;
    nRecurring = allRecurringReminders.length;
    nNoneRecurring = allNoneRecurringReminders.length;

    // if isRecurring wasn't specified
    if(isRecurring === null || isRecurring === undefined) {
        if(allNoneRecurringReminders.length == 0) {
            isRecurring = true;
        }
        else {
            isRecurring = false;
        }
    }
    let allReminders = isRecurring ? allRecurringReminders : allNoneRecurringReminders;

    if (!allReminders) {
        return ctx.reply("You need to /start first");
    }

    // if we just have one, display it to the user
    if(allReminders.length == 1) {
        return _displayOneReminderToTheUser(ctx, allReminders, allRecurringReminders,
            allNoneRecurringReminders, searchTerm, b64EncodedSearchTerm,
            isRecurring, nRecurring, nNoneRecurring);
    }

    let currentPageReminders;
    if (allReminders.length == 0) {
        pageNumber = 0;
        currentPageReminders = [];
    }
    else {
        let currentPageRemindersMatrix = _listToMatrix(allReminders, NUMBER_OF_REMINDERS_PER_PAGE);
        // if user deleted reminders, make sure we 
        if (pageNumber > currentPageRemindersMatrix.length) {
            pageNumber = currentPageRemindersMatrix.length;
        }
        currentPageReminders = currentPageRemindersMatrix[pageNumber - 1];
    }


    logger.info(`${userId}: list, isRecurring:${isRecurring} ${searchTerm},${currentPageReminders.length} reminders`);

    let markup = _getReminderButtonsMarkup(allReminders, currentPageReminders, pageNumber, b64EncodedSearchTerm, isRecurring, nRecurring, nNoneRecurring);

    // create 
    let remindersList = [];
    let i = (pageNumber - 1) * NUMBER_OF_REMINDERS_PER_PAGE + 1;
    for (let reminder of currentPageReminders) {
        remindersList.push(`<b>${i++})</b>  ${reminder.getFormattedReminder(true)}`);
    }
    let body = remindersList.join("\n——————————————\n");

    if (!remindersList.length) {
        let noRemindersMessage = `You have no ${isRecurring ? "🔄⏱" : "⏱"} reminders ${searchTerm.length != 0 ? `with the search query '${searchTerm}'` : ""}`;
        if (isFirstInTransaction) {
            return ctx.reply(noRemindersMessage, markup);
        }
        else {
            return ctx.editMessageText(noRemindersMessage, markup);
        }
    }

    let footer = '\n\nChoose number to view or edit:';

    let header = `You have ${isRecurring ? nRecurring + " 🔄⏱" : nNoneRecurring + " ⏱"} reminders:` + "\n" +
        (searchTerm.length != 0 ? `Search query ${searchTerm}` : "") + "\n\n";

    if (isFirstInTransaction) {
        return ctx.reply(header + body + footer, markup);
    }
    else {
        return ctx.editMessageText(header + body + footer, markup);
    }
}

function addToBot(bot) {
    bot.action(/LIST_NON_RECURRING_([0-9]+)_([^_]*)/, ctx => {
        logger.info(`${ctx.chat.id}: COMMAND_LIST_NON_RECURRING`);
        let userId = ctx.chat.id;
        let pageNumber = ctx.match[1];
        let b64EncodedSearchTerm = ctx.match[2];
        let searchTerm = Buffer.from(b64EncodedSearchTerm, 'base64').toString('ascii');
        _displayList(ctx, userId, searchTerm, pageNumber, false, false);

    });

    bot.action(/LIST_RECURRING_([0-9]+)_([^_]*)/, ctx => {
        logger.info(`${ctx.chat.id}: COMMAND_LIST_RECURRING`);
        let userId = ctx.chat.id;
        let pageNumber = ctx.match[1];
        let b64EncodedSearchTerm = ctx.match[2];
        let searchTerm = Buffer.from(b64EncodedSearchTerm, 'base64').toString('ascii');
        _displayList(ctx, userId, searchTerm, pageNumber, true, false);
    });

    let listCmdCallback = ctx => {
        logger.info(`${ctx.chat.id}: COMMAND_LIST`);
        let userId = ctx.chat.id;
        let searchTerm = ctx.message.text.split(" ")[1];
        let pageNumber = 1;
        _displayList(ctx, userId, searchTerm, pageNumber, null, true);
    };
    bot.command('list', listCmdCallback);
    bot.command('lista', listCmdCallback);
}

module.exports = {
    addToBot: addToBot
};