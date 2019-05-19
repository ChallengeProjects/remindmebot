const timemachine = require('timemachine'),
    utils = require('./utils.js'),
    moment = require('moment-timezone'),
    chrono = require('chrono-node-albinodrought'),
    errorCodes = require("./errorCodes.js");
timemachine.reset();

/**
 * Fix the Meridiem if it was implied by the chrono library (because it sucks)
 * Returns: {{ChronoResult, Moment}} result after fix and parsed date after fix
 */
// logic:
// parse the time part of the string
// try to apply both "am" and "pm" on it
// choose whatever is closer
function fixImpliedMeridiemOfChronoResult(currentDate, userTimezone, reminderDateTimeText) {
    // get text
    let timePart = Object.values(utils.getDateToTimePartsMapFromReminderDateTimeText(reminderDateTimeText))[0];
    let textWithpm = reminderDateTimeText.replace(timePart, timePart + " pm");
    let textWitham = reminderDateTimeText.replace(timePart, timePart + " am");

    // compute am and pm
    let parsedDatePM = moment.tz(moment(chrono.parseDate(textWithpm)).format("YYYY-MM-DDTHH:mm:ss"), userTimezone);
    let parsedDateAM = moment.tz(moment(chrono.parseDate(textWitham)).format("YYYY-MM-DDTHH:mm:ss"), userTimezone);
    let d;
    let result;

    // fix dates before choosing
    if (parsedDateAM.isBefore(currentDate)) {
        parsedDateAM.add(1, 'day');
    }
    if (parsedDatePM.isBefore(currentDate)) {
        parsedDatePM.add(1, 'day');
    }
    if (parsedDateAM.isBefore(parsedDatePM)) {
        d = parsedDateAM;
        result = chrono.parse(textWitham)[0];
    }
    else {
        d = parsedDatePM;
        result = chrono.parse(textWithpm)[0];
    }

    return {
        result: result,
        d: d
    };
}

// why not use 'meridiem' in result.start.impliedValues?
// because chrono sucks
// edge case in chrono: if the time is 12:xx am, and you say "at 12:10", it thinks 
// that the meridiem is a known value
function isMeridiemImplied(reminderDateTimeText) {
    let timePart = Object.values(utils.getDateToTimePartsMapFromReminderDateTimeText(reminderDateTimeText))[0];
    // meridiem is not an implied value if there is no time part
    if (!timePart.length) {
        return false;
    }
    return !timePart.match(new RegExp(`\b${utils.MERIDIEM_REGEX}\b`, 'i'));
}

function parseNonRecurringSingleDate(reminderDateTimeText, userTimezone) {
    reminderDateTimeText = reminderDateTimeText.trim();
    // remove double spaces in between
    reminderDateTimeText = reminderDateTimeText.split(" ").filter(x => !!x.length).join(" ");
    // parse dates that chrono wouldn't parse
    let { monthDay, time } = _parseCustomDateFormats(reminderDateTimeText, userTimezone);
    if (monthDay) {
        reminderDateTimeText = "on " + monthDay;
        if (time) {
            reminderDateTimeText += " " + time;
        }
    }

    let currentDate = moment.tz(userTimezone);
    // use timemachine to set the server's  date to be the  user's date, so stuff like "in 2 minutes"
    //  can be simply parsed with chrono
    timemachine.config({ dateString: moment.tz(userTimezone).format("MMMM DD, YYYY HH:mm:ss") });

    // capture "on [time]" and replace the "on" with "at", then make sure a ":" exists
    //  so chrono can parse it as time
    let onTimeMatch = reminderDateTimeText.match(/^on ([0-9:]+)$/i);
    if (onTimeMatch) {
        reminderDateTimeText = `at ${onTimeMatch[1]}`;
        if (onTimeMatch.indexOf(":") == -1) {
            reminderDateTimeText += ":00";
        }
    }

    let d = moment(chrono.parseDate(reminderDateTimeText));
    let result = chrono.parse(reminderDateTimeText)[0];

    if (isMeridiemImplied(reminderDateTimeText)) {
        let fixedReturn = fixImpliedMeridiemOfChronoResult(currentDate, userTimezone, reminderDateTimeText);
        result = fixedReturn.result;
        d = fixedReturn.d;
    }
    timemachine.reset();

    if (!result) {
        throw errorCodes.UNKOWN_ERROR;
    }

    let knownValues = result.start.knownValues;
    let impliedValues = result.start.impliedValues;

    let parsedDate;
    parsedDate = moment.tz(d.format("YYYY-MM-DDTHH:mm:ss"), userTimezone);

    // if user specified week day and it happens to be in the past
    //  then they probably dont want it to be today (unless they specified the 'day number')
    // Dont use .diff(, 'day') because it will calculate 24 hours, we want to make sure they are on different days, not strictly 24 hours difference
    // if('weekday' in knownValues && 'day' in impliedValues && (parsedDate.isBefore(currentDate) || parsedDate.isSame(currentDate, 'day'))) {
    if ('weekday' in knownValues && 'day' in impliedValues && parsedDate.isBefore(currentDate)) {
        parsedDate.add(7, 'day');
    }

    // if user specified date  (day and/or month) but didnt specify year, and date is in the past
    // then add one year
    if (('day' in knownValues || 'month' in knownValues) && 'year' in impliedValues && parsedDate.isBefore(currentDate)) {
        parsedDate.add(1, 'year');
    }

    // if the date is in the past
    if (parsedDate.isBefore(currentDate)) {
        if ('day' in impliedValues) {
            parsedDate.add(1, 'day');
        }
    }

    return parsedDate;
}

/**
 * @return {string} date parsed from ordinal
 * example:
 *     ".*january the 1st.*" -> "on January 1"
 *     ".*january.*" -> "on january"
 *     "the 24th" -> "on <current month> 24"
 */
function _getDateTextFromOrdinal(reminderDateText, userTimezone) {
    let month = null,
        day = null;
    let monthDayOrdinalRegexMatch = reminderDateText.match(/\b((january|february|march|april|may|june|july|august|september|october|november|december) )?the ([0-9]+)(st|nd|rd|th)?\b/i);
    let indices = { month: 2, day: 3 };
    if (!monthDayOrdinalRegexMatch) {
        return null;
    }
    month = monthDayOrdinalRegexMatch[indices.month];
    day = monthDayOrdinalRegexMatch[indices.day];

    let dateText = "on";
    if (month) {
        dateText += " " + month;
    }
    // if month wasn't provided then get the current month
    else {
        dateText += " " + moment.tz(userTimezone).format("MMMM");
    }
    if (day) {
        dateText += " " + day;
    }

    return dateText;
}

/**
 * Attempts to parse dates with ordinals, with or without time provided
 */
function _parseCustomDateFormats(reminderDateTimeText, userTimezone) {
    // what happens if we dont have monthDay
    let monthDay = _getDateTextFromOrdinal(utils.getDatePartsFromString(reminderDateTimeText)[0], userTimezone);

    let times = Object.values(utils.getDateToParsedTimesFromReminderDateTime(reminderDateTimeText))[0];

    if (!times || times.length == 0) {
        times = ["at 12 pm"];
    }

    return {
        monthDay: monthDay,
        time: times[0]
    };
}

module.exports = {
    parseNonRecurringSingleDate: parseNonRecurringSingleDate
};