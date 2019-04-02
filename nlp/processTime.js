const commonTypos = require("./commonTypos.json"),
    parseRecurringDates = require("./parseRecurringDates.js"),
    parseNonRecurringDate = require("./parseNonRecurringDate.js");
    // logger = require("./logger.js");

/**
 * splits user's command from the "to" or "that" delimiter into a datetime part and a text part
 * @param  {string} text user's text in format of "/remindme <datetime/time interval> to <text>"
 * @return {reminderText: <text>, reminderDateTimeText: <datetime/time interval>}
 * Example: /remindme to/every ... at ... to abcdef -> 
 * { reminderText: "abcdef", reminderDateTimeText: "to/every ... at ..."}
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

function correctSpellingForDateTimeText(reminderDateTimeText) {
    for(let correctWord in commonTypos) {
        for(let incorrectWord of commonTypos[correctWord]) {
            reminderDateTimeText = reminderDateTimeText.replace(new RegExp(`\\b${incorrectWord}\\b`, 'ig'), correctWord);
        }
    }
    return reminderDateTimeText;
}

function getDate(text, userTimezone) {
    let {reminderText, reminderDateTimeText} = _splitReminderText(text);
    reminderDateTimeText = correctSpellingForDateTimeText(reminderDateTimeText);
    let recurringDatesResult = parseRecurringDates.parseRecurringDates(reminderDateTimeText, userTimezone);
    if(recurringDatesResult) {
        let recurringDates = recurringDatesResult.recurringDates;
        let endingConditionDate = recurringDatesResult.endingConditionDate;
        return {
            reminderText: reminderText,
            reminderDate: {
                recurringDates: recurringDates,
                endingConditionDate: endingConditionDate,
            }
        };
    }
    else {
        let parsedDate = parseNonRecurringDate.parseNonRecurringDate(reminderDateTimeText, userTimezone);
        return {
            reminderText: reminderText,
            reminderDate: {date: parsedDate}
        };
    }
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