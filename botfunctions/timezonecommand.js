const
    catchBlocks = require("../errorhandling.js").catchBlocks,
    UserManager = require("../userManager.js"),
    logger = require("../logger.js"),
    moment = require("moment-timezone"),
    autocorrect = require("../utils/autocorrect.js"),
    config = require("../config.json")[process.env.NODE_ENV],
    cityTimezones = require('city-timezones'),
    googleMapsClient = require('@google/maps').createClient({
        key: config.googleMapsClientKey
    });

const INVALID_TIMEZONE_ERROR_MESSAGE = {
    'english': `You need to specify a valid timezone.
You can do this by either sending me your location 📍 (which is the simpler way).

Or by using the /timezone command:

<b>Examples:</b>
• <code>/timezone America Los Angeles</code>
• <code>/timezone Africa Cairo</code>
• <code>/timezone India</code>
• <code>/timezone China Beijing</code>
• <code>/timezone PDT</code>
• <code>/timezone EST</code>`,
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

function _parseUsingCityTimezone(timezoneInput) {
    // If it's a city
    let cityTimezonesResult = cityTimezones.lookupViaCity(timezoneInput);
    if(!!cityTimezonesResult && cityTimezonesResult.length != 0) {
        return cityTimezonesResult[0];
    }

    // If it's a country
    let countryResults = cityTimezones.cityMapping
        .filter(r => r.country.toLowerCase() == timezoneInput.toLowerCase());
    if(countryResults.length > 0) {
        return countryResults[0];
    }

    // If it's a "country city"
    let results = cityTimezones.cityMapping
        .filter(r => (r.country + " " + r.city).toLowerCase() == timezoneInput.toLowerCase());
    if(results.length > 0) {
        return results[0];
    }
}

/*
 Returns null if no timezone was found
 */
function _parseTimezone(timezoneInput) {
    if (!timezoneInput || timezoneInput.length == 0) {
        return null;
    }

    if (timezoneInput.toLowerCase() == "kuala lumpur" || timezoneInput.toLowerCase() == "malaysia") {
        return {
            parsedTimezone: "Kuala Lumpur Time",
            timezoneForMoment: "Asia/Kuala_Lumpur",
        };
    }
    if(["india", "asia india", "asia indian standard time", "ist", "asia republic of india", "asia pakistan", "gmt+5.5"].indexOf(timezoneInput.toLowerCase()) != -1) {
        return {
            parsedTimezone: "Indian Standard Time",
            timezoneForMoment: "Asia/Kolkata",
        };
    }

    let cityTimezonesResult = _parseUsingCityTimezone(timezoneInput);
    if (cityTimezonesResult) {
        return {
            parsedTimezone: cityTimezonesResult.country + " " + cityTimezonesResult.city,
            timezoneForMoment: cityTimezonesResult.timezone,
        };
    }

    // Example moment.tz([2012, 5], 'America/Los_Angeles').format('z') == 'PDT'
    // map: {'PDT': 'America/Los_Angeles', ..}
    let timezoneShortNamesMap = new Map(moment.tz.names().map(timezoneLongName => 
        [moment.tz([2012, 5], timezoneLongName).format('z').toUpperCase(), timezoneLongName]
    ));
    let listOfTimezones = [...moment.tz.names(), ...timezoneShortNamesMap.keys()];
    // timezone will be used to confirm with user
    let parsedTimezone = autocorrect.autocorrect(timezoneInput, listOfTimezones, 1/3);

    if(parsedTimezone == null) {
        return null;
    }
    // timezone will be used to give to moment (moment can't take the short form)
    let timezoneForMoment = parsedTimezone;
    if(timezoneShortNamesMap.has(timezoneForMoment)) {
        timezoneForMoment = timezoneShortNamesMap.get(timezoneForMoment);
    }
    return {
        parsedTimezone: parsedTimezone,
        timezoneForMoment: timezoneForMoment
    };
}

function timezoneCommandCallback(ctx, language) {
    let userId = ctx.chat.id;
    let timezoneInput = ctx.message.text.split(" ").slice(1).join(" "); // remove the first word ("/timezone")
    let result = _parseTimezone(timezoneInput);

    if (!result) {
        logger.info(`${ctx.chat.id}: timezone: TIMEZONE_INVALID:${timezoneInput}`);
        return ctx.replyWithHTML(INVALID_TIMEZONE_ERROR_MESSAGE[language]).catch(catchBlocks);
    }

    let {parsedTimezone, timezoneForMoment} = result;
    
    logger.info(`${ctx.chat.id}: timezone: TIMEZONE_VALID:${timezoneInput} --> ${timezoneForMoment}`);

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
    _parseTimezone: _parseTimezone
};