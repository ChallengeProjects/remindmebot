const logger = require("../logger.js"),
    UserManager = require("../userManager.js"),
    catchBlocks = require("../errorhandling.js").catchBlocks,
    config = require("../config.json");


const HELP_TEXT_ENGLISH = process.env.NODE_ENV == "developmentd" ? `This is an unreliable beta, please use the official bot: @${config["production"]["username"]} instead.` :  `Feel free to contact me @bubakazouba if you have any questions, feature requests or bug reports.
per l'italiano: /aiuto

1- /timezone to set your timezone
2- /list to list all of your reminders
    * You can do "/list work" to only list reminders the contain the word "work"
3- /help for help
4- Use /remindme to make reminders.

General formula is: /remindme [date/time] to/that [text].
<b>Notes:</b>
    • Don't forget the "to" or "that".
    • Has to be [date] first then the [text] and NOT the other way around.

<b>Examples:</b>
    • /remindme at 2 pm to do my homework
    • /remindme tomorrow at 5 pm to do my homework
    • /remindme on wednesday at 3 pm and on saturday at 10 am to wake up
    • /r in five minutes to check on the oven
    • /remindme on wednesday to pickup the kids from school
    • remind me on january 5th that today is my birthday!
    • remind me every weekday at 12 pm to call my son in school to check on him
    • remind me every hour until 6 pm to log my work
    • remind me every tuesday, wednesday at 3 and 4 pm and every saturday at 9 am to take my vitamins
    • remind me every weekday at 9 am and every weekend at 11 am to open up the store

You can also make recurring reminders: /help_with_recurring_reminders

<b>Edit Reminder Time</b>: ✏️⏱
<b>Edit Reminder Text</b>: ✏️📖
<b>Delete Reminder</b>: 🗑️
<b>Enable Reminder</b>: 🔔
<b>Disable Reminder</b>: 🔕
<b>Check off Reminder</b>: ✅
`;

const HELP_TEXT_ITALIAN = process.env.NODE_ENV == "development" ? `This is an unreliable beta, please use the official bot: @${config["production"]["username"]} instead.` :  ` Sentiti libero di contattarmi con il seguente nickname: @bubakazouba nel caso in cui avessi problemi, suggerimenti o segnalazioni di bugs.

1- /fuso_orario per impostare l’ora locale
2- /lista per vedere la lista di tutti i promemoria
    * Puoi scrivere “/list impegno” per mostrare tutti i promemoria che contengono la parola “impegno”
3- /aiuto per aiuto
4- Usa il comando /ricordami per creare un nuovo promemoria

Formula generale: /ricordami [data/orario] di/che [qualcosa].
Non dimenticarti il “di” o “che”

Esempi:

    • /ricordami alle 2 di pomeriggio di fare i compiti
    • /ricordami domani alle 5 di pomeriggio di fare i compiti
    • /r tra 5 minuti di controllare il forno
    • /ricordami mercoledì di prendere i bambini da scuola
    • ricordami il 5 Gennaio che oggi è il mio compleanno
    • ricordami ogni giorno della settimana alle 12 di pomeriggio di chiamare mio figlio  
    • ricordami ogni ora sino alle 6 di pomeriggio di registrare il mio lavoro 

Puoi anche creare promemoria ricorrenti: /aiuto_con_promemoria_ricorrenti

<b>Modifica l’orario promemoria</b>: ✏️⏱
<b>Modifica il testo promemoria</b>: ✏️📖
<b>Elimina promemoria</b>: 🗑️
<b>Attiva promemoria</b>: 🔔
<b>Disattiva promemoria</b>: 🔕
<b>Spunta il reminder</b>: ✅`;

const HELP_WITH_RECURRING_REMINDERS_TEXT_ENGLISH = `To setup recurring reminders:
/remindme every day at 9 am and 9 pm to take my medicine
/remindme every sunday at 10 am to do my laundry
/remindme every monday,wednesday,friday at 5 pm to leave at 6 from work to pick up the kids
/remindme every 2 hours to check my email
/remindme every weekday at 9 am and every weekend at 11 am to open up the store

keyword is <b>every</b>`;

const HELP_WITH_RECURRING_REMINDERS_TEXT_ITALIAN = `Per configurareil tuo promemoria ricorrente:
/ricordami ogni giorno alle 9 di mattina e alle 9 di sera di prendere le mie medicien
/ricordami ogni domenica  alle 10 di mattina di lavare i panni
/ricordami ogni lunedì, mercoledì e venerdi alle 5 di pomeriggio di andare via dal lavoro per prendere i bambini
/ricordami ogni 2 ore di controllare la mia mail
`;

const ABOUT_TEXT = `This bot was created by @bubakazouba. The source code is available on <a href='https://github.com/bubakazouba/remindmebot'>Github</a>.\nContact me for feature requests or bug reports!`;

function addToBot(bot) {
    bot.command('aiuto', ctx => {
        logger.info(`${ctx.chat.id}: COMMAND_HELP`);
        return ctx.replyWithHTML(HELP_TEXT_ITALIAN).catch(catchBlocks);
    });

    bot.command('help', ctx => {
        logger.info(`${ctx.chat.id}: COMMAND_HELP`);
        return ctx.replyWithHTML(HELP_TEXT_ENGLISH).catch(catchBlocks);
    });

    bot.command('help_with_recurring_reminders', ctx => {
        return ctx.replyWithHTML(HELP_WITH_RECURRING_REMINDERS_TEXT_ENGLISH).catch(catchBlocks);
    });

    bot.command('aiuto_con_promemoria_ricorrenti', ctx => {
        return ctx.replyWithHTML(HELP_WITH_RECURRING_REMINDERS_TEXT_ITALIAN).catch(catchBlocks);
    });

    bot.command('start', ctx => {
        logger.info(`${ctx.chat.id}: COMMAND_START`);
        UserManager.addUser(ctx.chat.id, ctx.chat.username);
        return ctx.replyWithHTML('Hi there 👋! This is a simple bot that helps you remember things.' + '\n' + HELP_TEXT_ENGLISH).catch(catchBlocks);
    });

    bot.command('start_italian', ctx => {
        logger.info(`${ctx.chat.id}: COMMAND_START`);
        UserManager.addUser(ctx.chat.id, ctx.chat.username);
        return ctx.replyWithHTML('Ciao👋! Questo è un semplice BOT che ti aiuterà a ricordare qualcosa.' + '\n' + HELP_TEXT_ITALIAN).catch(catchBlocks);
    });

    bot.command('about', ctx => {
        return ctx.replyWithHTML(ABOUT_TEXT).catch(catchBlocks);
    });
}

module.exports = {
    addToBot: addToBot
};