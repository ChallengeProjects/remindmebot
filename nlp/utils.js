const moment = require('moment-timezone'),
    {NLPContainer, NLPDate, NLPTime, NLPInterval} = require("./models/date.js");

const TIME_NUMBER_REGEX = '[0-9:]+';
const MERIDIEM_REGEX = '(a\\.?m\\.?|p\\.?m\\.?)';
let UNITS = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
UNITS = [...UNITS, ...UNITS.map(u => u + 's')]; // add plural forms too

// capture "on [time]" and replace the "on" with "at", then make sure a ":" exists
//  so chrono can parse it as time
// This is needed because of 2 reasons
//  1- To be more flexible with users that like to use "on" as a prefix to time
//  2- More importantly, parseRecurringDates._convertEndingDateTimeTextToReminderDateTimeText
//      does not differentiate dates and times, it simply prefixes them both with "on"
function _convertOnTimetoAtTime(reminderDateTimeText) {
    let onTimeMatch = reminderDateTimeText.match(new RegExp(`^on\\s(${TIME_NUMBER_REGEX})(\\s(${MERIDIEM_REGEX})?)?$`, 'i'));
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
function getDateToTimePartsMapFromReminderDateTimeText(str) {
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

// [see tests for examples]
function getNLPContainersFromReminderDateTimeText(reminderDateTimeText) {
    reminderDateTimeText = _convertOnTimetoAtTime(reminderDateTimeText);
    let dateToTimeMap = getDateToTimePartsMapFromReminderDateTimeText(reminderDateTimeText);

    let allNLPContainers = [];
    for (let date in dateToTimeMap) {
        let allNLPObjects = [];
        if (date == 'undefined') {
            allNLPObjects = [null];
        }
        else {
            allNLPObjects = _convertDatesTextToNLPObjects(date);
        }

        let timePart = dateToTimeMap[date];
        if (!timePart.length) {
            allNLPContainers.push(...(allNLPObjects.map(x => new NLPContainer(x))));
            continue;
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

        for (let nlpObject of allNLPObjects) {
            for (let nlpTime of nlpTimes) {
                allNLPContainers.push(new NLPContainer(nlpObject, nlpTime));
            }
        }
    }
    return allNLPContainers;
}

/**
 * match dates of format "month the nth", "the nth of month"
 */
// TODO: isOnRequired is a hack and i should get rid of it (see TODOS.java for explanation)
// TODO: this shouldnt return a regex match, it should return 3 variables:
//  complete match, day, month
function regexMatchDateTextOrdinal(reminderDateText, isOnRequired) {
    const MONTHS = moment.months();

    let onMatch;
    if(isOnRequired) {
        onMatch = `(?:on )`;
    }
    else {
        onMatch = `(?:on )?`;
    }
    let monthDayOrdinalRegexMatchFormat1 = reminderDateText.match(new RegExp(`\\b${onMatch}(?:the )?(?:(${MONTHS.join("|")}) )?(?:the )?([0-9]+)(?:st|nd|rd|th|$)`, 'i'));
    
    let indicesFormat1 = { month: 1, day: 2 };
    let format1Result = {
        regexMatch: monthDayOrdinalRegexMatchFormat1,
        indices: indicesFormat1,
    };

    let monthDayOrdinalRegexMatchFormat2 = reminderDateText.match(new RegExp(`\\b${onMatch}(?:the )?([0-9]+)(?:st|nd|rd|th)? (?:of )?(${MONTHS.join("|")})\\b`, 'i'));
    let indicesFormat2 = { day: 1, month: 2 };
    let format2Result = {
        regexMatch: monthDayOrdinalRegexMatchFormat2,
        indices: indicesFormat2,
    };


    let didFormat1Work = !!monthDayOrdinalRegexMatchFormat1;
    let didFormat2Work = !!monthDayOrdinalRegexMatchFormat2;

    if(!didFormat1Work && !didFormat2Work) {
        return null;
    }
    else if( !didFormat1Work && didFormat2Work) {
        return format2Result;
    }
    else if(!didFormat2Work && didFormat1Work) {
        return format1Result;
    }
    // if they both worked
    //  1- check if 1 doesnt have a month, then pick 2
    //  2- check which one comes first in the string using .index and pick that one
    else if(didFormat1Work && didFormat2Work) {
        if(!monthDayOrdinalRegexMatchFormat1[indicesFormat1.month]) {
            return format2Result;
        }

        if(monthDayOrdinalRegexMatchFormat1.index < monthDayOrdinalRegexMatchFormat2.index) {
            return format1Result;
        }
        return format2Result;
    }
}

// "on 02/03 02/04" -> [NLPDate]
// "on march the 2nd april the 1st" -> [NLPDate, NLPDate]
// "on the 2nd of march april the 1st" -> [NLPDate, NLPDate]
// "on the 2nd of march 1st of april" -> [NLPDate, NLPDate]
// "on monday tuesday" -> [NLPInterval, NLPInterval]
/**
 * Algorithm:
 *  1- extract out all weekday and remove it
 *  2- extract out all x(x?)/x(x?) and remove it
 *  3- extract out all "in/every x? <unit>" and remove it
 *  4- extract out all "xth of <month>" and remove it
 *  5- extract out all "<month> the xth" and remove it
 *  6- extract out all "the xth" and remove it
 */
function _convertDatesTextToNLPObjects(datesText) {
    let allNLPObjects = [];
    // the reason im removing any regexMatch I find after I push it is to make sure
    //  that the ordinal function doesnt match them again

    //////////////////////////////
    // try to parse units
    let intervalRegexpString = `\\b(every |in |on |this )?([0-9]+ )?(${UNITS.join("|")})\\b`;
    let regexMatches = datesText.match(new RegExp(intervalRegexpString, 'ig'));
    regexMatches = regexMatches || [];
    for(let regexMatch of regexMatches) {
        datesText = datesText.replace(regexMatch, '');
        let match = regexMatch.match(new RegExp(intervalRegexpString, 'i'));
        let number = match[2];
        let unit = match[3];
        allNLPObjects.push(new NLPInterval(number, unit));
    }
    //////////////////////////////
    
    /////////////////////////////////
    let weekDayRegexpString = `\\b(on |every |this )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|tomorrow)\\b`;
    regexMatches = datesText.match(new RegExp(weekDayRegexpString, 'ig'));
    regexMatches = regexMatches || [];
    for(let regexMatch of regexMatches) {
        datesText = datesText.replace(regexMatch, '');
        let match = regexMatch.match(new RegExp(weekDayRegexpString, 'i'));
        let number = 1;

        let unit = match[2];
        if (unit.toLowerCase() == 'tomorrow') {
            unit = 'day';
        }
        allNLPObjects.push(new NLPInterval(number, unit));

    }
    //////////////////////////////
    
    //////////////////////////////
    // try to match x(x?)/x(x?)
    let dateRegexpString = `\\b(on )?[0-9]([0-9])?/[0-9]([0-9])?(/[0-9][0-9]|/[0-9][0-9]([0-9][0-9])?)?\\b`;
    regexMatches = datesText.match(new RegExp(dateRegexpString, 'ig'));
    regexMatches = regexMatches || [];
    for(let regexMatch of regexMatches) {
        datesText = datesText.replace(regexMatch, '');
        let dateString = regexMatch.split(" ").filter(word => word.toLowerCase() != "on").join(" ");
        if (dateString.split("/").length == 3) {
            allNLPObjects.push(new NLPDate(dateString.split("/")[2], dateString.split("/")[0], dateString.split("/")[1]));
        }
        else {
            allNLPObjects.push(new NLPDate(null, dateString.split("/")[0], dateString.split("/")[1]));
        }
    }
    //////////////////////////////

    while(true) {
        let result = regexMatchDateTextOrdinal(datesText, false);
        if(!result) {
            break;
        }
        let oneDate = result.regexMatch[0];
        datesText = datesText.replace(oneDate, '');
        let { regexMatch, indices } = result;
        allNLPObjects.push(new NLPDate(null, regexMatch[indices.month], regexMatch[indices.day]));
    }
    
    return allNLPObjects;
}

/**
 * [see tests for examples]
 * @return {[String]} dates part of the string seperated by each time part
 */
function getDatePartsFromString(reminderDateTimeText) {
    let dateToTimePartsMap = getDateToTimePartsMapFromReminderDateTimeText(reminderDateTimeText);
    return Object.keys(dateToTimePartsMap);
}

module.exports = {
    getDatePartsFromString: getDatePartsFromString,
    getDateToTimePartsMapFromReminderDateTimeText: getDateToTimePartsMapFromReminderDateTimeText,
    getNLPContainersFromReminderDateTimeText: getNLPContainersFromReminderDateTimeText,
    TIME_NUMBER_REGEX: TIME_NUMBER_REGEX,
    MERIDIEM_REGEX: MERIDIEM_REGEX,
    UNITS: UNITS,
    regexMatchDateTextOrdinal: regexMatchDateTextOrdinal,
    // only exported for unit tests
    _parseTimesStringToArray: _parseTimesStringToArray,
    _convertDatesTextToNLPObjects: _convertDatesTextToNLPObjects,
};