const timemachine = require('../timemachine.js'),
    utils = require('./utils.js'),
    moment = require('moment-timezone'),
    chrono = require('chrono-node-albinodrought'),
    errorCodes = require("./errorCodes.js");

/**
 * Fix the Meridiem if it was implied by the chrono library (because it sucks)
 * Returns: {{ChronoResult, Moment}} result after fix and parsed date after fix
 */
// logic:
// parse the time part of the string
// try to apply both "am" and "pm" on it
// choose whatever is closer
function _fixImpliedMeridiemOfChronoResult(currentDate, userTimezone, reminderDateTimeText) {
    // get text
    let timePart = Object.values(utils.getDateToTimePartsMapFromReminderDateTimeText(reminderDateTimeText))[0];
    let textWithpm = reminderDateTimeText.replace(timePart, timePart + " pm");
    let textWitham = reminderDateTimeText.replace(timePart, timePart + " am");

    // compute am and pm
    let parsedDatePM = moment.tz(moment(chrono.parseDate(textWithpm)).format("YYYY-MM-DDTHH:mm:ss"), userTimezone);
    let parsedDateAM = moment.tz(moment(chrono.parseDate(textWitham)).format("YYYY-MM-DDTHH:mm:ss"), userTimezone);
    let d;
    let result;
    let didAMAdd1Day = false;
    let didPMAdd1Day = false;
    // fix dates before choosing
    if (parsedDateAM.isBefore(currentDate)) {
        parsedDateAM.add(1, 'day');
        didAMAdd1Day = true;
    }
    if (parsedDatePM.isBefore(currentDate)) {
        parsedDatePM.add(1, 'day');
        didPMAdd1Day = true;
    }
    if (parsedDateAM.isBefore(parsedDatePM)) {
        d = parsedDateAM;
        if (didAMAdd1Day) {
            d.add(-1, 'day');
        }
        result = chrono.parse(textWitham)[0];
    }
    else {
        d = parsedDatePM;
        if (didPMAdd1Day) {
            d.add(-1, 'day');
        }
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
function _isMeridiemImplied(reminderDateTimeText) {
    let timePart = Object.values(utils.getDateToTimePartsMapFromReminderDateTimeText(reminderDateTimeText))[0];
    // meridiem is not an implied value if there is no time part
    if (!timePart.length) {
        return false;
    }
    return !timePart.match(new RegExp(`\\b${utils.MERIDIEM_REGEX}\\b`, 'i'));
}

function parseNonRecurringSingleDate(reminderDateTimeText, userTimezone) {
    reminderDateTimeText = reminderDateTimeText.trim();
    // remove double spaces in between
    reminderDateTimeText = reminderDateTimeText.split(" ").filter(x => !!x.length).join(" ");
    // convert on [time] -> at [time] (before _parseCustomDateFormats)
    reminderDateTimeText = _convertOnTimetoAtTime(reminderDateTimeText);
    // parse dates that chrono wouldn't parse
    reminderDateTimeText = _parseCustomDateFormats(reminderDateTimeText, userTimezone);

    let currentDate = moment.tz(userTimezone);
    // use timemachine to set the server's date to be the user's date, so stuff like "in 2 minutes"
    //  can be simply parsed with chrono
    timemachine.config({ dateString: moment.tz(userTimezone).format("MMMM DD, YYYY HH:mm:ss") });

    let d = moment(chrono.parseDate(reminderDateTimeText));
    let result = chrono.parse(reminderDateTimeText)[0];
    if (_isMeridiemImplied(reminderDateTimeText)) {
        let fixedReturn = _fixImpliedMeridiemOfChronoResult(currentDate, userTimezone, reminderDateTimeText);
        result = fixedReturn.result;
        d = fixedReturn.d;
    }
    timemachine.reset();

    if (!result) {
        throw errorCodes.UNKOWN_ERROR;
    }

    let parsedDate;
    parsedDate = moment.tz(d.format("YYYY-MM-DDTHH:mm:ss"), userTimezone);

    parsedDate = _fixDatesInThePast(parsedDate, currentDate, result);

    return parsedDate;
}

// capture "on [time]" and replace the "on" with "at", then make sure a ":" exists
//  so chrono can parse it as time
// This is needed because of 2 reasons
//  1- To be more flexible with users that like to use "on" as a prefix to time
//  2- More importantly, parseRecurringDates._convertEndingDateTimeTextToReminderDateTimeText
//      does not differentiate dates and times, it simply prefixes them both with "on"
function _convertOnTimetoAtTime(reminderDateTimeText) {
    let onTimeMatch = reminderDateTimeText.match(new RegExp(`^on\\s(${utils.TIME_NUMBER_REGEX})(\\s(${utils.MERIDIEM_REGEX})?)?$`, 'i'));
    let timeIndex = 1;
    let meridiemIndex = 3;

    if (!onTimeMatch) {
        return reminderDateTimeText;
    }
    let timeText = onTimeMatch[timeIndex];
    if (timeText.indexOf(":") == -1) {
        timeText += ":00";
    }

    if (onTimeMatch[meridiemIndex]) {
        return `at ${timeText} ${onTimeMatch[meridiemIndex]}`;
    }
    else {
        return `at ${timeText}`;
    }
}


function _fixDatesInThePast(date, currentDate, result) {
    let knownValues = result.start.knownValues;
    let impliedValues = result.start.impliedValues;

    // if user specified week day and it happens to be in the past
    //  then they probably dont want it to be today (unless they specified the 'day number')
    // Dont use .diff(, 'day') because it will calculate 24 hours, we want to make sure they are on different days, not strictly 24 hours difference
    // if('weekday' in knownValues && 'day' in impliedValues && (date.isBefore(currentDate) || date.isSame(currentDate, 'day'))) {
    if ((date.isBefore(currentDate) || date.isSame(currentDate, 'day')) && 'weekday' in knownValues && 'day' in impliedValues) {
        date.add(7, 'day');
        return date;
    }

    if (!date.isBefore(currentDate)) {
        return date;
    }

    // if user specified date  (day and/or month) but didnt specify year, and date is in the past
    // then add one year
    if (('day' in knownValues || 'month' in knownValues) && 'year' in impliedValues) {
        date.add(1, 'year');
        return date;
    }

    // if the date is in the past and it is implied
    if ('day' in impliedValues) {
        date.add(1, 'day');
        return date;
    }
    return date;
}

/**
 * @return {string} date parsed from ordinal
 * example:
 *     ".*january the 1st.*" -> "on January 1"
 *     ".*january.*" -> "on january"
 *     "the 24th" -> "on <current month> 24"
 */
function _getDateTextFromOrdinal(reminderDateText, userTimezone) {
    let result = utils.regexMatchDateTextOrdinal(reminderDateText, true);
    if (!result) {
        return null;
    }
    let { regexMatch, indices } = result;

    let month = regexMatch[indices.month];
    let day = regexMatch[indices.day];
    if (!day || day.length > 2) {
        return null;
    }
    day = day.length == 2 ? day : "0" + day;

    let dateText;
    if (month) {
        month = moment().month(month).format("MM");
        dateText = month + "/" + day;
    }
    // if month wasn't provided then get the current month (or next month)
    else if (!month) {
        let currentDate = moment.tz(userTimezone);
        // if the date w/ current month is in the future thats ok
        let dateWithCurrentMonth = currentDate.format("MM") + "/" + day;
        if (currentDate.format("MM/DD") <= dateWithCurrentMonth) {
            dateText = dateWithCurrentMonth;
        }
        else {
            dateText = currentDate.add(1, 'months').format("MM") + "/" + day;
        }
    }

    return dateText;
}

// "in <n> <weekday>" -> "on 08/03"
function _parseInNWeekdays(reminderDateTimeText, userTimezone) {
    // try to parse units
    let weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    weekdays = [...weekdays, ...weekdays.map(u => u + 's')]; // add plural forms too
    let match = reminderDateTimeText.match(new RegExp(`in ([0-9]+ )?(${weekdays.join("|")})\\b`, 'ig'));
    let n, weekday;
    if (!match) {
        return null;
    }
    match = match[0];
    let split = match.split(" ");
    if (split.length == 3) { // n is there "every 3 minutes"
        n = parseInt(split[1].trim());
        weekday = split[2];
    }
    else { // no n
        n = 1;
        weekday = split[1];
    }
    // remove the s
    if (weekday[weekday.length - 1] == "s") {
        weekday = weekday.substr(0, weekday.length - 1);
    }

    // Algorithm:
    //  1- compute "on <weekday>"
    //  2- add n-1 weeks to the resulting date
    //  3- return "on mm/dd"

    // 1-
    let currentDate = moment.tz(userTimezone);
    // use timemachine to set the server's date to be the user's date, so stuff like "in 2 minutes"
    //  can be simply parsed with chrono
    timemachine.config({ dateString: moment.tz(userTimezone).format("MMMM DD, YYYY HH:mm:ss") });

    let newReminderDateTimeText = `on ${weekday}`;
    let d = moment(chrono.parseDate(newReminderDateTimeText));
    let result = chrono.parse(newReminderDateTimeText)[0];
    timemachine.reset();

    let parsedDate;
    parsedDate = moment.tz(d.format("YYYY-MM-DDTHH:mm:ss"), userTimezone);
    parsedDate = _fixDatesInThePast(parsedDate, currentDate, result);

    // 2-
    parsedDate.add(n - 1, 'weeks');
    // 3-
    return parsedDate.format("MM/DD");
}

/**
 * Attempts to parse dates with ordinals, with or without time provided
 * 1- month day w(/o) ordinal
 * 2- in [0-9] saturdays
 */
function _parseCustomDateFormats(reminderDateTimeText, userTimezone) {
    let monthDay = _getDateTextFromOrdinal(utils.getDatePartsFromString(reminderDateTimeText)[0], userTimezone);
    // if not date text ordinal, try in N weekdays
    if (!monthDay) {
        monthDay = _parseInNWeekdays(reminderDateTimeText, userTimezone);
        // if not that either, just return as it is
        if (!monthDay) {
            return reminderDateTimeText;
        }
    }

    let times = Object.values(utils.getDateToParsedTimesFromReminderDateTime(reminderDateTimeText));
    let time;
    // if undefined, or if there arent any values, or if there is only one value of an empty array
    if (!times || times.length == 0 || (times.length == 1 && times[0].length == 0)) {
        time = "at 12 pm";
    }
    else {
        time = times[0];
    }
    return "on " + monthDay + " " + time;
}

module.exports = {
    parseNonRecurringSingleDate: parseNonRecurringSingleDate,
    _isMeridiemImplied: _isMeridiemImplied,
    _getDateTextFromOrdinal: _getDateTextFromOrdinal,
    _parseInNWeekdays: _parseInNWeekdays,
    _convertOnTimetoAtTime: _convertOnTimetoAtTime,
    _parseCustomDateFormats: _parseCustomDateFormats,
};