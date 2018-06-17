const chrono = require('chrono-node-albinodrought'),
    moment = require('moment-timezone');

/**
 * @param  {string} text user's text in format of "/remindme <datetime/time interval> to <text>"
 * @return {}      [description]
 */
function _splitReminderText(text) {
    text = text.trim();

    const DELIMITERS = {
        TO: " to ",
        THAT: " that "
    };
    
    let toIndex = text.toLowerCase().indexOf(DELIMITERS.TO);
    let thatIndex = text.toLowerCase().indexOf(DELIMITERS.THAT);
    if(toIndex == -1 && thatIndex == -1) {
        throw 'Could not parse';
    }
    toIndex = toIndex == -1 ? Number.MAX_VALUE : toIndex;
    thatIndex = thatIndex == -1 ? Number.MAX_VALUE : thatIndex;
    let splitIndex = Math.min(toIndex, thatIndex);
    let selectedDelimiter = toIndex < thatIndex ? DELIMITERS.TO : DELIMITERS.THAT;

    let reminderText = text.slice(splitIndex + selectedDelimiter.length);
    let reminderDateTime = text.slice(text.indexOf(" ") + 1, splitIndex); // ignore the first word (the command /remindme)

    return {
        reminderText: reminderText.trim(),
        reminderDateTimeText: reminderDateTime.trim()
    };
}

function _getDateFromOrdinal(str, userTimezone) {
    let month = null, day = null, time = null, meridiem = null;
    let monthDayOrdinalRegexMatch = str.match(/\b((january|february|march|april|may|june|july|august|september|october|november|december) )?the ([0-9]+)(st|nd|rd|th)( at ([0-9]+(:[0-9]+)?) (am|pm))?/i);
    let indices = {month: 2, day: 3, time: 6, meridiem: 8};
    if(!monthDayOrdinalRegexMatch) {
        return null;
    }
    month = monthDayOrdinalRegexMatch[indices.month],
    day = monthDayOrdinalRegexMatch[indices.day],
    time = monthDayOrdinalRegexMatch[indices.time],
    meridiem = monthDayOrdinalRegexMatch[indices.meridiem];

    let newStr = "on";
    if(month){
        newStr += " " + month;
    }
    else {
        newStr += " " + moment.tz(userTimezone).format("MMMM");
    }
    if(day) {
        newStr += " " + day;
    }
    if(time) {
        newStr += " at " + time;
        if(meridiem) {
            newStr += " " + meridiem;
        }
    }
    
    return newStr;
}

function getDate(text, userTimezone) {
    let {reminderText, reminderDateTimeText} = _splitReminderText(text);

    let newStr = _getDateFromOrdinal(reminderDateTimeText, userTimezone);
    
    if(newStr) {
        reminderDateTimeText = newStr;
    }

    let d = moment(chrono.parseDate(reminderDateTimeText));
    let parsedDate;
    if(reminderDateTimeText.trim().startsWith("in")) {
        parsedDate = moment.tz(d, userTimezone);
    }
    else {
        parsedDate = moment.tz(d.format("YYYY-MM-DDTHH:mm:ss"), userTimezone);
    }
    
    let currentDate = moment.tz(userTimezone);

    let result = chrono.parse(reminderDateTimeText)[0];

    if(!result) {
        throw 'Could not parse';
    }

    let knownValues = result.start.knownValues;
    let impliedValues = result.start.impliedValues;

    // if user specified week day and it happens to be today
    //  then they probably dont want it to be today (unless they specified the 'day')
    if('weekday' in knownValues && 'day' in impliedValues && parsedDate.isSame(currentDate, 'day')) {
        parsedDate.add(7, 'day');
    }

    // if the date is in the past
    if(currentDate.isAfter(parsedDate)) {
        if('day' in impliedValues) {
            parsedDate.add(1, 'day');
        }
    }

    return {
        reminderText: reminderText,
        reminderDate: parsedDate
    };
}
/*
TESTS:
all of this logic has nothing to do when you specify a period of time "in", this only works with "on" or "at"
saturday at 4pm should be next saturday if today is saturday
4pm should be tomorrow 4 pm if 4pm has already passed today
*/

module.exports = {
    getDate: getDate,
    //only exported for unit tests
    _splitReminderText: _splitReminderText
};