const
    catchBlocks = require("../errorhandling.js").catchBlocks,
    UserManager = require("../userManager.js"),
    logger = require("../logger.js"),
    moment = require("moment-timezone"),
    autocorrect = require("../utils/autocorrect.js"),
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

// function to be called when user sends a location
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

    // respond with the help message if the user didn't provide a timezone
    if (!timezoneInput || timezoneInput.length == 0) {
        return ctx.replyWithHTML(INVALID_TIMEZONE_ERROR_MESSAGE[language]).catch(catchBlocks);
    }

    // Example moment.tz([2012, 5], 'America/Los_Angeles').format('z') == 'PDT'
    // map: {'PDT': 'America/Los_Angeles', ..}
    let timezoneShortNamesMap = new Map(moment.tz.names().map(timezoneLongName => 
        [moment.tz([2012, 5], timezoneLongName).format('z').toUpperCase(), timezoneLongName]
    ));
    let listOfTimezones = [...moment.tz.names(), ...timezoneShortNamesMap.keys()];
    // timezone will be used to confirm with user
    let parsedTimezone = autocorrect.autocorrect(timezoneInput, listOfTimezones, 1/3);

    let timezoneForMoment;
    if (timezoneInput.toLowerCase() == "kuala lumpur" || timezoneInput.toLowerCase() == "malaysia") {
        timezoneForMoment = "Asia/Kuala_Lumpur";
    }
    else if(["india", "asia india", "asia indian standard time", "ist", "asia republic of india", "asia pakistan", "gmt+5.5"].indexOf(timezoneInput.toLowerCase()) != -1) {
        timezoneForMoment = "Asia/Kolkata";
    }
    else {
        if(parsedTimezone == null) {
            logger.info(`${ctx.chat.id}: timezone: TIMEZONE_INVALID:${timezoneInput}`);
            return ctx.replyWithHTML(INVALID_TIMEZONE_ERROR_MESSAGE[language]).catch(catchBlocks);
        }
        // timezone will be used to give to moment (moment can't take the short form)
        timezoneForMoment = parsedTimezone;
        if(timezoneShortNamesMap.has(timezoneForMoment)) {
            timezoneForMoment = timezoneShortNamesMap.get(timezoneForMoment);
        }
    }
    
    logger.info(`${ctx.chat.id}: timezone: TIMEZONE_VALID:${timezoneInput}`);

    UserManager.setUserTimezone(userId, timezoneForMoment);
    return ctx.replyWithHTML("<code>Ok your timezone now is </code>" + parsedTimezone + "<code>. You can now start setting reminders!</code>").catch(catchBlocks);
}

function addToBot(bot) {
    bot.command('timezone', (ctx) => {
        timezoneCommandCallback(ctx, 'english');
    });
    bot.on('location', locationCallback);
}

module.exports = {
    addToBot: addToBot,
};