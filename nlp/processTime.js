const commonTypos = require("./commonTypos.json"),
    parseRecurringDates = require("./parseRecurringDates.js"),
    parseNonRecurringSingleDate = require("./parseNonRecurringSingleDate.js"),
    utils = require("./utils.js"),
    errorCodes = require("./errorCodes.js"),
    translationMaps = require("./translationMaps.json");

// logger = require("./logger.js");
// 
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
        DI: "di".toLowerCase(), // "to" in Italian
        CHI: "chi".toLowerCase(), // "that" in Italian
    };

    // Find the minimum index of any split delimiter
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
        throw errorCodes.NO_DELIMITER_PROVIDED;
    }

    let reminderText = text.slice(selectedSplitDelimiterIndex + selectedSplitDelimiter.length);
    let reminderDateTimeText = text.slice(text.indexOf(" ") + 1, selectedSplitDelimiterIndex); // ignore the first word (the command /remindme)

    return {
        reminderText: reminderText.trim(),
        reminderDateTimeText: reminderDateTimeText.trim()
    };
}

function _correctSpellingForDateTimeText(reminderDateTimeText) {
    for (let correctWord in commonTypos) {
        for (let incorrectWord of commonTypos[correctWord]) {
            reminderDateTimeText = reminderDateTimeText.replace(new RegExp(`\\b${incorrectWord}\\b`, 'ig'), correctWord);
        }
    }

    // xxx-> x:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-9])([0-5][0-9])\b/g, "$1 $2:$3");
    // xxxx->xx:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-1][0-9]|2[0-4])([0-5][0-9])\b/g, "$1 $2:$3");

    // 10w -> 10 weeks,10 w -> 10 weeks
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)w\b/g, "$1 weeks");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)d\b/g, "$1 days");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)h\b/g, "$1 hours");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)m\b/g, "$1 minutes");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)s\b/g, "$1 seconds");
    return reminderDateTimeText;
}

function translate(reminderDateTimeText) {
    for (let foreignLanguage in translationMaps) {
        let foreignLanguageMap = translationMaps[foreignLanguage];
        for (let foreignLanguageWord in foreignLanguageMap) {
            let englishWord = foreignLanguageMap[foreignLanguageWord];
            reminderDateTimeText = reminderDateTimeText.replace(new RegExp(`\\b${foreignLanguageWord}\\b`, 'ig'), englishWord);
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
    reminderDateTimeText = translate(reminderDateTimeText);
    console.log("after translate: '"+reminderDateTimeText+"'");
    
    let recurringDatesResult = parseRecurringDates.parseRecurringDates(reminderDateTimeText, userTimezone);
    if (recurringDatesResult) {
        let recurringDates = recurringDatesResult.recurringDates;
        let endingConditionDate = recurringDatesResult.endingConditionDate;
        return {
            reminderText: reminderText,
            reminderDates: {
                recurringDates: recurringDates,
                endingConditionDate: endingConditionDate,
            }
        };
    }
    else {
        let dateToTimesMap = utils.getDateToParsedTimesFromReminderDateTime(reminderDateTimeText);
        
        // Compute cross product for each date
        let parsedDates = [];
        for(let date in dateToTimesMap) {
            if(!dateToTimesMap[date].length) {
                let parsedDate = parseNonRecurringSingleDate.parseNonRecurringSingleDate(date, userTimezone);
                parsedDates.push(parsedDate);
            }
            else {
                for(let time of dateToTimesMap[date]) {
                    let dateTimeText = date + " " + time;
                    let parsedDate = parseNonRecurringSingleDate.parseNonRecurringSingleDate(dateTimeText, userTimezone);
                    parsedDates.push(parsedDate);
                }
            }
        }
        
        return {
            reminderText: reminderText,
            reminderDates: { dates: parsedDates }
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
    _splitReminderText: _splitReminderText,
};