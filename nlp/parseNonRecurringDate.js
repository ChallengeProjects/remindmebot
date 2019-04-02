const timemachine = require('timemachine'),
    utils = require('./utils.js'),
    moment = require('moment-timezone'),
    chrono = require('chrono-node-albinodrought');

/**
 * Fix the Meridiem if it was implied  by the chrono library (because it sucks)
 * Returns: {{ChronoResult, Moment}} result after fix and parsed date after fix
 */
// logic:
// parse the time part of the string
// try to apply both "am" and "pm" on it
// choose whatever is closer
function fixImpliedMeridiemOfChronoResult(currentDate, userTimezone, result, reminderDateTimeText) {
    // get text
    let timePart = utils.getTimePartFromString(reminderDateTimeText);
    let textWithpm = reminderDateTimeText.replace(timePart, timePart + " pm");
    let textWitham = reminderDateTimeText.replace(timePart, timePart + " am");
    
    // compute am and pm
    let parsedDatePM = moment.tz(moment(chrono.parseDate(textWithpm)).format("YYYY-MM-DDTHH:mm:ss"), userTimezone);
    let parsedDateAM = moment.tz(moment(chrono.parseDate(textWitham)).format("YYYY-MM-DDTHH:mm:ss"), userTimezone);
    let d;
    // fix dates before choosing
    if(parsedDateAM.isBefore(currentDate)) {
        parsedDateAM.add(1, 'day');
    }
    if(parsedDatePM.isBefore(currentDate)) {
        parsedDatePM.add(1, 'day');
    }
    
    if(parsedDateAM.isBefore(parsedDatePM)) {
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

function parseNonRecurringDate(reminderDateTimeText, userTimezone) {
    // parse dates that chrono wouldn't parse
    let {monthDay, time} = _parseCustomDateFormats(reminderDateTimeText, userTimezone);
    
    if(monthDay) {
        reminderDateTimeText = "on " + monthDay;
        if(time) {
            reminderDateTimeText += " " + time;
        }
    }

    let currentDate = moment.tz(userTimezone);
    // use timemachine to set the server's  date to be the  user's date, so stuff like "in 2 minutes"
    //  can be simply parsed with chrono
    timemachine.config({dateString: moment.tz(userTimezone).format("MMMM DD, YYYY HH:mm:ss")});
    let d = moment(chrono.parseDate(reminderDateTimeText));
    let result = chrono.parse(reminderDateTimeText)[0];

    if('meridiem' in result.start.impliedValues) {
        let fixedReturn = fixImpliedMeridiemOfChronoResult(currentDate, userTimezone, result, reminderDateTimeText);
        result = fixedReturn.result;
        d = fixedReturn.d;
    }
    timemachine.reset();

    if(!result) {
        throw 'Could not parse';
    }
    let knownValues = result.start.knownValues;
    let impliedValues = result.start.impliedValues;

    let parsedDate;
    parsedDate = moment.tz(d.format("YYYY-MM-DDTHH:mm:ss"), userTimezone);
    
    // if user specified week day and it happens to be in the past
    //  then they probably dont want it to be today (unless they specified the 'day number')
    //  dont use .diff(, 'day') because it will calculate 24 hours, we want to make sure they are on different days, not strictly 24 hours difference
    // if('weekday' in knownValues && 'day' in impliedValues && (parsedDate.isBefore(currentDate) || parsedDate.isSame(currentDate, 'day'))) {
    if('weekday' in knownValues && 'day' in impliedValues && parsedDate.isBefore(currentDate)) {
        parsedDate.add(7, 'day');
    }

    // if user specified date  (day and/or month) but didnt specify year, and date is in the past
    // then add one year
    if(('day' in knownValues || 'month' in knownValues) && 'year' in impliedValues && parsedDate.isBefore(currentDate)) {
        parsedDate.add(1, 'year');
    }

    // if the date is in the past
    if(parsedDate.isBefore(currentDate)) {
        if('day' in impliedValues) {
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
    let month = null, day = null;
    let monthDayOrdinalRegexMatch = reminderDateText.match(/\b((january|february|march|april|may|june|july|august|september|october|november|december) )?the ([0-9]+)(st|nd|rd|th)?\b/i);
    let indices = {month: 2, day: 3};
    if(!monthDayOrdinalRegexMatch) {
        return null;
    }
    month = monthDayOrdinalRegexMatch[indices.month];
    day = monthDayOrdinalRegexMatch[indices.day];

    let dateText = "on";
    if(month){
        dateText += " " + month;
    }
    // if month wasn't provided then get the current month
    else {
        dateText += " " + moment.tz(userTimezone).format("MMMM");
    }
    if(day) {
        dateText += " " + day;
    }

    return dateText;
}

/**
 * Attempts to parse dates with ordinals, with or without time provided
 */
function _parseCustomDateFormats(reminderDateTimeText, userTimezone) {
    // what happens if we dont have monthDay
    let monthDay = _getDateTextFromOrdinal(utils.getDatePartFromString(reminderDateTimeText), userTimezone);
    
    let times = utils.getTimesFromString(reminderDateTimeText);

    if(!times || times.length == 0) {
        times = ["at 12 pm"];
    }

    return {
        monthDay: monthDay,
        time: times[0]
    };
}

module.exports = {
    parseNonRecurringDate: parseNonRecurringDate
};