const { NLPTime } = require("./models/date.js");
const TIME_NUMBER_REGEX = '[0-9:]+';
const MERIDIEM_REGEX = '(a\\.?m\\.?|p\\.?m\\.?)';

function getDateToNLPTimesMapFromReminderDateTimeText(str) {
    let dateToTimePartsMap = _getDateToTimePartsMapFromReminderDateTimeText(str);
    let dateToNLPTimesMap = {};
    for (let key in dateToTimePartsMap) {
        let timeParts = dateToTimePartsMap[key];
        dateToNLPTimesMap[key] = _getNLPTimesFromTimePart(timeParts);
    }       
    return dateToNLPTimesMap;
}

// [see tests for examples]
function _getDateToTimePartsMapFromReminderDateTimeText(str) {
    str = str.toLowerCase();

    // algorithm:
    //  1- find time parts using TIME_REGEX
    //  2- everything else is DateParts, split by TIME_REGEX
    //  3- create the map from date(s) -> time(s)
    
    str = str.replace(/,/g, " , ").replace(/ {1,}/g, " ");


    // there can be multiple at's together, example: "at 3 pm at 4 pm"
    const TIME_REGEX_WITH_AT = new RegExp(`at\\b(${TIME_NUMBER_REGEX}|${MERIDIEM_REGEX}|at|,|and|\\s)+`, 'g');
    const TIME_REGEX_NO_AT = new RegExp(`\\b(${TIME_NUMBER_REGEX} ${MERIDIEM_REGEX})(?:|at|,|and|\\s)+`, 'g');

    let timeParts = [...(str.match(TIME_REGEX_WITH_AT) || []), ...(str.replace(TIME_REGEX_WITH_AT, "").match(TIME_REGEX_NO_AT) || [])];
    
    const RANDOM_DELIMITER = "!@#";
    // get the dates list by splitting on the time pieces

    // replace any time part with the delimiter
    for (let timePart of timeParts) {
        str = str.replace(timePart, RANDOM_DELIMITER);
    }
    
    let dateParts = str
        .split(RANDOM_DELIMITER) // now split with the delimiter
        .filter(x => !!x) // remove any undefined elements
        .map(x => x.trim().replace(/ {1,}/g, " ")) // trim and remove double spaces
        .filter(x => !!x.length); // remove any empty elements in the list

    // clean up timeParts from "and" and ","
    timeParts = timeParts
        .map(x => x.replace(/\band\b|,/g, " ")
            .replace(/ {1,}/g, " "))
        .map(x => x.trim());

    // create the map and return
    let datesToTimeMap = {};
    for (let i = 0; i < Math.max(timeParts.length, dateParts.length); i++) {
        if (i == timeParts.length) {
            datesToTimeMap[dateParts[i]] = [];
        }
        else {
            datesToTimeMap[dateParts[i]] = timeParts[i];
        }
    }

    return datesToTimeMap;
}

// capture "on [time]" and replace the "on" with "at", then make sure a ":" exists
//  so chrono can parse it as time
// This is needed because of 2 reasons
//  1- To be more flexible with users that like to use "on" as a prefix to time
//  2- More importantly, parseRecurringDates._convertEndingDateTimeTextToReminderDateTimeText
//      does not differentiate dates and times, it simply prefixes them both with "on"
function _convertOnTimetoAtTime(reminderDateTimeText) {
    let onTimeMatch = reminderDateTimeText.match(new RegExp(`^on\\s(${TIME_NUMBER_REGEX})(\\s?(${MERIDIEM_REGEX})?)?$`, 'i'));
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

// "at 3" -> ["3"]
// "at 3 4 pm " -> ["3", "4", "pm"]
// "at 3 am, 4 pm" -> ["3", "am", "4", "pm"]
function _parseTimesStringToArray(timePart) {
    timePart = timePart.toLowerCase();
    let words = timePart.split(" ");

    if(words[0] == "at") {
        words = words.slice(1);
    }

    words = words.join(" ") // remove the "at"
        .replace(new RegExp(`(${TIME_NUMBER_REGEX})(${MERIDIEM_REGEX})`, 'g'), "$1 $2") // seperate numbers joined with am/pm
        .replace(/(,|\band\b|\bat\b)/g, " ") // replace "," or "and" or "at" with " "
        .split(" ").filter(x => !!x.length); // split again to an array and remove all empty strings
    return words;
}

// [see tests for examples]
function _getNLPTimesFromTimePart(timePart) {
    if (!timePart.length) {
        return [];
    }
    let nlpTimes = [];
    let words = _parseTimesStringToArray(timePart);
    // Now we just need to assign the meridiem for each time

    // Split the array by meridiem
    // ["3","4","pm","5","am","7"] -> ["3 4", "pm", "5","am","7"]
    // Even indices are times, odd indices are meridiems
    words = words.join(" ").split(new RegExp(MERIDIEM_REGEX));
    let timesPartsOfWords = words.filter((v, i) => i % 2 == 0);
    let meridiemsPartsOfWords = words.filter((v, i) => i % 2 == 1);
    for (let i = 0; i < timesPartsOfWords.length; i++) {
        let timesSplit = timesPartsOfWords[i].split(" ").filter(x => !!x.length);
        let meridiem = meridiemsPartsOfWords.length > i ? (" " + meridiemsPartsOfWords[i]) : ("");
        for(let timeString of timesSplit) {
            let hour, minute;
            if (timeString.split(":").length == 2) {
                hour = timeString.split(":")[0];
                minute = timeString.split(":")[1];
            }
            else {
                hour = timeString;
                minute = undefined;
            }
            nlpTimes.push(new NLPTime(hour, minute, meridiem));
        }
    }
    return nlpTimes;
}

module.exports = {
    TIME_NUMBER_REGEX: TIME_NUMBER_REGEX,
    MERIDIEM_REGEX: MERIDIEM_REGEX,
    getDateToNLPTimesMapFromReminderDateTimeText: getDateToNLPTimesMapFromReminderDateTimeText,
    _getDateToTimePartsMapFromReminderDateTimeText: _getDateToTimePartsMapFromReminderDateTimeText,
    _getNLPTimesFromTimePart: _getNLPTimesFromTimePart,
    _convertOnTimetoAtTime: _convertOnTimetoAtTime,
    _parseTimesStringToArray: _parseTimesStringToArray,
};