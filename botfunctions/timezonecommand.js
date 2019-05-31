const
    catchBlocks = require("../errorhandling.js").catchBlocks,
    UserManager = require("../userManager.js"),
    logger = require("../logger.js"),
    moment = require("moment-timezone"),
    autocorrect = require('autocorrect')({ words: moment.tz.names() }),
    config = require("../config.json")[process.env.NODE_ENV],
    googleMapsClient = require('@google/maps').createClient({
        key: config.googleMapsClientKey
    });

const INVALID_TIMEZONE_ERROR_MESSAGE = {
    'english': `You need to specify a valid timezone.
You can do this by either sending your location 📍 or by using the /timezone command:

<b>Examples:</b>
• <code>/timezone Europe Italy</code>
• <code>/timezone America Los Angeles</code>
• <code>/timezone Africa Cairo</code>
• <code>/timezone PDT</code>
• <code>/timezone EST</code>
You can find your timezone with a map <a href="https://momentjs.com/timezone/">here</a>.`,
    'italian': `Devi scrivere un fuso orario valido.
Puoi fare questo inviando la tua posizione 📍 o usando il comando /fuso_orario:

Esempi:
• /fuso_orario Europe Italy
• /fuso_orario America Los Angeles
• /fuso_orario Africa Cairo
• /fuso_orario PDT
• /fuso_orario EST

Puoi trovare il tuo fuso orario con la mappa <a href="https://momentjs.com/timezone/">here</a>`,
};

function _convertCoordinatesToTimezone(latitude, longitude) {
    let timestamp = Math.floor(Date.now() / 1000);

    return new Promise((resolve, reject) => {
        googleMapsClient.timezone({
            location: [latitude, longitude],
            timestamp: timestamp,
            language: 'en'
        }, (err, res) => {
            if (!err) {
                resolve(res.json.timeZoneId);
            }
            else {
                logger.info("google maps error:", err);
                reject(null);
            }
        });
    });
}

function locationCallback(ctx) {
    const userId = ctx.from.id;
    const userLatitude = Number(ctx.message.location.latitude);
    const userLongitude = Number(ctx.message.location.longitude);

    _convertCoordinatesToTimezone(userLatitude, userLongitude).then(timezoneId => {
        UserManager.setUserTimezone(userId, timezoneId);
        if (timezoneId) {
            logger.info(`${ctx.chat.id}: timezone: TIMEZONE_VALID_LOCATION:${timezoneId}`);
            ctx.replyWithHTML(`<code>Your timezone has been set to ${timezoneId}. You can now start setting reminders!</code>`);
        }
        else {
            logger.info(`${ctx.chat.id}: timezone: TIMEZONE_LOCATION_ERROR`);
            ctx.replyWithHTML("<code>Something went wrong. Please try again at a later time</code>");
        }
    });
}

function timezoneCommandCallback(ctx, language) {
    let userId = ctx.chat.id;
    let timezoneInput = ctx.message.text.split(" ").slice(1).join(" "); // remove the first word ("/timezone")
    let parsedTimezone;
    
    if (!timezoneInput || timezoneInput.length == 0) {
        return ctx.replyWithHTML(INVALID_TIMEZONE_ERROR_MESSAGE[language]).catch(catchBlocks);
    }
    // if timezone is not one of the valid moment timezones
    if (!moment.tz.zone(timezoneInput)) {
        // try to get it from the short names list
        // Example moment.tz([2012, 5], 'America/Los_Angeles').format('z') == 'PDT'
        let timezoneShortNamesMap = new Map(moment.tz.names().map(timezoneLongName => [moment.tz([2012, 5], timezoneLongName).format('z').toUpperCase(), timezoneLongName]));
        if (timezoneShortNamesMap.has(timezoneInput.toUpperCase())) {
            parsedTimezone = timezoneShortNamesMap.get(timezoneInput.toUpperCase()); // get the long name from here
        }
        // just try to autocorrect then
        else {
            parsedTimezone = autocorrect(timezoneInput);
        }
    }
    else {
        parsedTimezone = timezoneInput;
    }
    console.log("parsedTimezone=" + parsedTimezone);
    if (!moment.tz.zone(parsedTimezone)) {
        logger.info(`${ctx.chat.id}: timezone: TIMEZONE_INVALID:${timezoneInput}`);
        return ctx.replyWithHTML(INVALID_TIMEZONE_ERROR_MESSAGE[language]).catch(catchBlocks);
    }
    logger.info(`${ctx.chat.id}: timezone: TIMEZONE_VALID:${timezoneInput}`);

    UserManager.setUserTimezone(userId, parsedTimezone);
    return ctx.replyWithHTML("<code>Ok your timezone now is </code>" + timezoneInput + "<code>. You can now start setting reminders!</code>").catch(catchBlocks);
}

function addToBot(bot) {
    bot.command('timezone', timezoneCommandCallback, 'english');
    bot.command('fuso_orario', timezoneCommandCallback, 'italian');
    bot.on('location', locationCallback);
}

module.exports = {
    addToBot: addToBot,
};