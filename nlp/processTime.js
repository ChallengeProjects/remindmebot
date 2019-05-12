const commonTypos = require("./commonTypos.json"),
    parseRecurringDates = require("./parseRecurringDates.js"),
    parseNonRecurringSingleDate = require("./parseNonRecurringSingleDate.js");
// logger = require("./logger.js");

const PARSE_ERROR_MESSAGES = {
    'NO_DELIMITER_PROVIDED': 'NO_DELIMITER_PROVIDED',
};
/**
 * splits user's command from the "to" or "that" delimiter into a datetime part and a text part
 * @param  {string} text user's text in format of "/remindme <datetime/time interval> to <text>"
 * @return {reminderText: <text>, reminderDateTimeText: <datetime/time interval>}
 * Example: /remindme to/every ... at ... to abcdef -> 
 * { reminderText: "abcdef", reminderDateTimeText: "to/every ... at ..."}
 */
function _splitReminderText(text) {
    // get the index of the first delimiter
    const SPLIT_DELIMITERS = {
        TO: "to".toLowerCase(),
        THAT: "that".toLowerCase(),
    };

    let selectedSplitDelimiterIndex = Number.MAX_VALUE;
    let selectedSplitDelimiter = null;
    for (let splitDelimiter of Object.values(SPLIT_DELIMITERS)) {
        let matchResult = text.toLowerCase().match(new RegExp(`\\b${splitDelimiter}\\b`, 'i'));
        if(!matchResult) {
            continue;
        }
        let currentIndex = matchResult.index;
        if (currentIndex < selectedSplitDelimiterIndex) {
            selectedSplitDelimiter = splitDelimiter;
            selectedSplitDelimiterIndex = currentIndex;
        }
    }

    if (selectedSplitDelimiterIndex == Number.MAX_VALUE) {
        throw PARSE_ERROR_MESSAGES.NO_DELIMITER_PROVIDED;
    }

    let reminderText = text.slice(selectedSplitDelimiterIndex + selectedSplitDelimiter.length);
    let reminderDateTime = text.slice(text.indexOf(" ") + 1, selectedSplitDelimiterIndex); // ignore the first word (the command /remindme)

    return {
        reminderText: reminderText.trim(),
        reminderDateTimeText: reminderDateTime.trim()
    };
}

function _correctSpellingForDateTimeText(reminderDateTimeText) {
    for (let correctWord in commonTypos) {
        for (let incorrectWord of commonTypos[correctWord]) {
            reminderDateTimeText = reminderDateTimeText.replace(new RegExp(`\\b${incorrectWord}\\b`, 'ig'), correctWord);
        }
    }
    return reminderDateTimeText;
}

function getDate(text, userTimezone) {
    // remove double spaces from text
    text = text.replace(/ {1,}/g, " ");
    text = text.trim();
    let { reminderText, reminderDateTimeText } = _splitReminderText(text);
    reminderDateTimeText = _correctSpellingForDateTimeText(reminderDateTimeText);
    let recurringDatesResult = parseRecurringDates.parseRecurringDates(reminderDateTimeText, userTimezone);
    if (recurringDatesResult) {
        let recurringDates = recurringDatesResult.recurringDates;
        let endingConditionDate = recurringDatesResult.endingConditionDate;
        return {
            reminderText: reminderText,
            reminderDate: {
                recurringDates: recurringDates,
                endingConditionDate: endingConditionDate,
            }
        };
    } else {
        let parsedDate = parseNonRecurringSingleDate.parseNonRecurringSingleDate(reminderDateTimeText, userTimezone);
        return {
            reminderText: reminderText,
            reminderDate: { date: parsedDate }
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
    PARSE_ERROR_MESSAGES: PARSE_ERROR_MESSAGES,
    //only exported for unit tests
    _splitReminderText: _splitReminderText,
};