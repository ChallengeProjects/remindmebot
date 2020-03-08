const moment = require('moment-timezone'),
    {NLPContainer, NLPDate, NLPInterval} = require("./models/date.js"),
    timeutils = require("./timeutils.js");

let UNITS = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
UNITS = [...UNITS, ...UNITS.map(u => u + 's')]; // add plural forms too

// [see tests for examples]
function getNLPContainersFromReminderDateTimeText(reminderDateTimeText) {
    reminderDateTimeText = timeutils._convertOnTimetoAtTime(reminderDateTimeText);
    let dateToTimePartsMap = timeutils.getDateToNLPTimesMapFromReminderDateTimeText(reminderDateTimeText);

    let allNLPContainers = [];
    for (let date in dateToTimePartsMap) {
        let nlpContainersForDate = [];
        if (date == 'undefined') {
            nlpContainersForDate = [null];
        }
        else {
            nlpContainersForDate = _convertDatesTextToNLPContainers(date);
        }

        let nlpTimes = dateToTimePartsMap[date];

        for (let nlpContainer of nlpContainersForDate) {
            if (!nlpTimes.length) {
                allNLPContainers.push(nlpContainer);
            }
            for (let nlpTime of nlpTimes) {
                if (!nlpContainer) {
                    nlpContainer = new NLPContainer();
                }

                let currentNLPContainer = nlpContainer.clone();
                currentNLPContainer.mergeNLPTime(nlpTime);
                allNLPContainers.push(currentNLPContainer);
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
function _regexMatchDateTextOrdinal(reminderDateText, isOnRequired) {
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
function _convertDatesTextToNLPContainers(datesText) {
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
        let result = _regexMatchDateTextOrdinal(datesText, false);
        if(!result) {
            break;
        }
        let oneDate = result.regexMatch[0];
        datesText = datesText.replace(oneDate, '');
        let { regexMatch, indices } = result;
        allNLPObjects.push(new NLPDate(null, regexMatch[indices.month], regexMatch[indices.day]));
    }
    
    return allNLPObjects.map(x => new NLPContainer(x));
}

module.exports = {
    getNLPContainersFromReminderDateTimeText: getNLPContainersFromReminderDateTimeText,
    UNITS: UNITS,
    // only exported for unit tests
    _convertDatesTextToNLPContainers: _convertDatesTextToNLPContainers,
    _regexMatchDateTextOrdinal: _regexMatchDateTextOrdinal,
};