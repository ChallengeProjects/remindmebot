const moment = require('moment-timezone');

const TIME_NUMBER_REGEX = '[0-9:]+';
const MERIDIEM_REGEX = '(a\\.?m\\.?|p\\.?m\\.?)';

function isTimeNumber(word) {
    return !!word.match(new RegExp(`^${TIME_NUMBER_REGEX}$`));
}

function isMeridiem(word) {
    return !!word.match(new RegExp(`^${MERIDIEM_REGEX}$`, 'i'));
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
    const TIME_REGEX = new RegExp(`at\\b(${TIME_NUMBER_REGEX}|${MERIDIEM_REGEX}|at|,|and|\\s)+`, 'g');
    let timeParts = str.match(TIME_REGEX);
    if(!!timeParts) {
        // clean up timeParts from "and" and ","
        timeParts = timeParts
            .map(x => x.replace(/\band\b|,/g, " ")
                .replace(/ {1,}/g, " "))
            .map(x => x.trim());

    }
    else {
        timeParts = [];
    }

    const RANDOM_DELIMITER = "!@#";
    let dateParts = str
        .replace(TIME_REGEX, RANDOM_DELIMITER)
        .split(RANDOM_DELIMITER)
        .filter(x => !!x) // remove any undefined elements
        .map(x => x.trim().replace(/ {1,}/g, " ")) // trim and remove double spaces
        .filter(x => !!x.length); // remove any empty elements in the list

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

    return _seperateDatesInDatesToTimesMap(datesToTimeMap);
    // return datesToTimeMap;
}

// [see tests for examples]
function getDateToParsedTimesFromReminderDateTime(reminderDateTimeText) {
    let dateToTimeMap = getDateToTimePartsMapFromReminderDateTimeText(reminderDateTimeText);

    let dateToParsedTimesMap = {};

    for (let date in dateToTimeMap) {
        let timePart = dateToTimeMap[date];
        if (!timePart.length) {
            dateToParsedTimesMap[date] = [];
            continue;
        }
        let times = [];
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
            times.push(...timesSplit.map(x => `at ${x}${meridiem}`));
        }
        dateToParsedTimesMap[date] = times;
    }

    // return dateToParsedTimesMap;
    return _seperateDatesInDatesToTimesMap(dateToParsedTimesMap);
}

/**
 * match dates of format "month the nth", "the nth of month"
 */
// TODO: isOnRequired is a hack and i should get rid of it (see TODOS.java for explanation)
function regexMatchDateTextOrdinal(reminderDateText, isOnRequired) {
    const MONTHS = moment.months();

    let onMatch;
    if(isOnRequired) {
        onMatch = `(on )`;
    }
    else {
        onMatch = `(on )?`;
    }
    let monthDayOrdinalRegexMatchFormat1 = reminderDateText.match(new RegExp(`\\b${onMatch}(the )?((${MONTHS.join("|")}) )?(the )?([0-9]+)(st|nd|rd|th)?\\b`, 'i'));
    let indicesFormat1 = { month: 4, day: 6 };
    let format1Result = {
        regexMatch: monthDayOrdinalRegexMatchFormat1,
        indices: indicesFormat1,
    };

    let monthDayOrdinalRegexMatchFormat2 = reminderDateText.match(new RegExp(`\\b${onMatch}(the )?([0-9]+)(st|nd|rd|th)? (of )?(${MONTHS.join("|")})\\b`, 'i'));
    let indicesFormat2 = { day: 3, month: 6 };
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

// {"on 02/03 02/04": ["at 3 pm"]} -> {"on 02/03": ["at 3 pm"], "on 02/04": ["at 3 pm"]}
// {"on march the 2nd april the 1st": ["at 3 pm"]} -> {"on march the 2nd": ["at 3 pm"], "april the 1st": ["at 3 pm"]}
// {"on the 2nd of march april the 1st": ["at 3 pm"]} -> {"on the 2nd of march": ["at 3 pm"], "april the 1st": ["at 3 pm"]}
// {"on the 2nd of march 1st of april": ["at 3 pm"]} -> {"on the 2nd of march": ["at 3 pm"], "1st of april": ["at 3 pm"]}
// {"on monday tuesday": ["at 3 pm"]} -> {"on monday": ["at 3 pm"], "tuesday": ["at 3 pm"]}
function _seperateDatesInDatesToTimesMap(datesToTimesMap) {
    /**
     * Algorithm:
     *  1- extract out all weekday and remove it
     *  2- extract out all x(x?)/x(x?) and remove it
     *  3- extract out all "in/every x? <unit>" and remove it
     *  4- extract out all "xth of <month>" and remove it
     *  5- extract out all "<month> the xth" and remove it
     *  6- extract out all "the xth" and remove it
     */
    
    function matchEverything(datesText) {
        let allParsedDateTexts = [];
        // the reason im removing any regexMatch I find after I push it is to make sure
        //  that the ordinal function doesnt match them again

        //////////////////////////////
        let regexMatches = datesText.match(/\b(on |every |this )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|tomorrow)\b/ig);
        regexMatches = regexMatches || [];
        for(let regexMatch of regexMatches) {
            datesText = datesText.replace(regexMatch, '');
        }
        allParsedDateTexts.push(...regexMatches);
        //////////////////////////////
        
        //////////////////////////////
        // try to match x(x?)/x(x?)
        regexMatches = datesText.match(/\b(on )?[0-9]([0-9])?\/[0-9]([0-9])?\b/ig);
        regexMatches = regexMatches || [];
        for(let regexMatch of regexMatches) {
            datesText = datesText.replace(regexMatch, '');
        }
        allParsedDateTexts.push(...regexMatches);
        //////////////////////////////

        //////////////////////////////
        // try to parse units
        let units = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];
        units = [...units, ...units.map(u => u + 's')]; // add plural forms too
        regexMatches = datesText.match(new RegExp(`\\b(every|in) ([0-9]+ )?(${units.join("|")})\\b`, 'ig'));
        regexMatches = regexMatches || [];
        for(let regexMatch of regexMatches) {
            datesText = datesText.replace(regexMatch, '');
        }
        allParsedDateTexts.push(...regexMatches);
        //////////////////////////////

        while(true) {
            let result = regexMatchDateTextOrdinal(datesText, false);
            if(!result) {
                break;
            }
            let oneDate = result.regexMatch[0];
            datesText = datesText.replace(oneDate, '');
            allParsedDateTexts.push(oneDate);
        }
        
        return allParsedDateTexts;
    }
    let seperatedDatesToTimesMap = {};

    // if there are no dates in the map (dates = 'undefined', yes apparently
    //  JS converts it to a string when it's a key)
    if(Object.keys(datesToTimesMap).length == 1 && Object.keys(datesToTimesMap)[0] == 'undefined') {
        return datesToTimesMap;
    }

    for(let datesText in datesToTimesMap) {
        let times = datesToTimesMap[datesText];
        let allParsedDateTexts = matchEverything(datesText);
        if(!!allParsedDateTexts) {
            for (let dateText of allParsedDateTexts) {
                seperatedDatesToTimesMap[dateText] = times;
            }
        }
    }
    return seperatedDatesToTimesMap;
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
    getDateToParsedTimesFromReminderDateTime: getDateToParsedTimesFromReminderDateTime,
    getDateToTimePartsMapFromReminderDateTimeText: getDateToTimePartsMapFromReminderDateTimeText,
    isMeridiem: isMeridiem,
    isTimeNumber: isTimeNumber,
    MERIDIEM_REGEX: MERIDIEM_REGEX,
    // only exported for unit tests
    _parseTimesStringToArray: _parseTimesStringToArray,
    _seperateDatesInDatesToTimesMap: _seperateDatesInDatesToTimesMap,
    regexMatchDateTextOrdinal: regexMatchDateTextOrdinal,
};