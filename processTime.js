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

function _getTimePartFromString(str) {
    let atSegments = str.replace(/\b(on)\b/g, "at").split("at").filter(x => !!x.length);
    for(let atSegment of atSegments) {
        let words = atSegment.replace(/,/g, " ").split(" ").filter(x => !!x.length);

        let flag = true;
        for(let word of words) {
            if(!word.match(/^[0-9:]+$/i) && !word.match(/^(am|pm)$/i)) {
                flag = false;
            }
        }
        if(flag) {
            return "at " + atSegment.trim();
        }
    }

    return null;
}

function _getDatePartFromString(str) {
    let timePartFromString = _getTimePartFromString(str);
    if(!timePartFromString) {
        return str;
    }

    return str.replace(_getTimePartFromString(str), "").trim();
}

// function to get day part
// function to get time part
function _getTimesFromString(str) {
    let times = [];
    let timePartFromString = _getTimePartFromString(str);

    //if nothing
    if(!timePartFromString) {
        return null;
    }

    // if no recurrence
    if(timePartFromString.indexOf(",") == -1) {
        return [timePartFromString];
    }

    // str = "3 4 pm " [3, 4, pm]
    // str = "3 am, 4 pm" [3, am, 4, pm]
    // remove the "at" then replace all commas by spaces then split by spaces to get all the words
    let words = timePartFromString.split(" ").slice(1).join(" ").replace(/,/g, " ").split(" ").filter(x => !!x.length);

    let tempArrayUntilMeridiem = [];
    for(let word of words) {
        // if this word is a meridiem then process it and clear it
        if(word.match(/^(am|pm)$/i)) {
            let meridiem = word;
            for(let tempWord of tempArrayUntilMeridiem) {
                times.push("at " + tempWord + " " + meridiem);
            }
            tempArrayUntilMeridiem = [];
        }
        else {
            tempArrayUntilMeridiem.push(word);
        }
    }
    
    return times;
}

function _getDateFromOrdinal(str, userTimezone) {
    let month = null, day = null;
    let monthDayOrdinalRegexMatch = str.match(/\b((january|february|march|april|may|june|july|august|september|october|november|december) )?the ([0-9]+)(st|nd|rd|th)?\b/i);
    let indices = {month: 2, day: 3};
    if(!monthDayOrdinalRegexMatch) {
        return null;
    }
    month = monthDayOrdinalRegexMatch[indices.month];
    day = monthDayOrdinalRegexMatch[indices.day];

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

    return newStr;
}

function _parseCustomDateFormats(str, userTimezone) {
    // what happens if we dont have monthDay
    let monthDay = _getDateFromOrdinal(_getDatePartFromString(str), userTimezone);
    
    let times = _getTimesFromString(str);

    if(!times || times.length == 0) {
        times = ["at 12 pm"];
    }

    return {
        monthDay: monthDay,
        time: times[0]
    };
}

function getDate(text, userTimezone) {
    let {reminderText, reminderDateTimeText} = _splitReminderText(text);

    let {monthDay, time} = _parseCustomDateFormats(reminderDateTimeText, userTimezone);
    
    if(monthDay) {
        reminderDateTimeText = "on " + monthDay;
        if(time) {
            reminderDateTimeText += " " + time;
        }
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
    // if user specified week day and it happens to be today or in the past
    //  then they probably dont want it to be today (unless they specified the 'day')
    //  dont use .diff(, 'day') because it will calculate 24 hours, we want to make sure they are on different days, not strictly 24 hours difference
    if('weekday' in knownValues && 'day' in impliedValues && parseInt(currentDate.format("DD")) - parseInt(parsedDate.format("DD")) >= 0) {
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