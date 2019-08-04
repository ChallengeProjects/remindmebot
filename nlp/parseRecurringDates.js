const utils = require('./utils.js'),
    parseNonRecurringSingleDate = require('./parseNonRecurringSingleDate');

function _getRecurringDates(dateText) {
    dateText = dateText.replace(/(,|and)/ig, ' ');

    // try to parse units
    let units = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    units = [...units, ...units.map(u => u + 's')]; // add plural forms too
    
    let unitMatches = dateText.match(new RegExp(`([0-9]+ )?(${units.join("|")})\\b`, 'ig'));
    let dates = [];
    if (unitMatches) {
        for(let unitMatch of unitMatches) {
            let split = unitMatch.split(" ");
            let frequency, unit;
            if(split.length == 2) { // frequency is there "every 3 minutes"
                frequency = parseInt(split[0].trim());
                unit = split[1];
            }
            else { // no frequency "every minute"
                frequency = 1;
                unit = split[0];
            }
            dates.push(`in ${frequency} ${unit}`);
        }
    }
    return [...new Set(dates)];
}

/**
 * Self descriptive name
 * @return {String} reminderDateTimeText
 * example: "until 5 minutes from now" -> "in 5 days"
 * example: "until 2 days from now at 2 pm" -> "in 2 days at 2 pm"
 * example: "until 04/02 at 3 pm" -> "on 04/02 at 3 pm"
 * example: "until 3 pm" -> "on 3 pm"
 * example: "until 3" -> "on 3"
 * ----
 * example: "for 3 days" -> "in 3 days"
 * example: "for 3 hours" -> "in 3 hours"
 */
// logic:
// 1- if found "^until .* from (now|today)*"
//      1.1- remove "from (now|today)"
//      1.2- remove "until" 
//      1.3- prepend "in "
// 2- if found "^until"
//      2.1- remove "until"
//      2.2- prepend "on"
// 3- if found "^for "
//      2.1- remove "for"
//      2.2- prepend "in "
function _convertEndingDateTimeTextToReminderDateTimeText(endingDateTimeText) {
    let untilFromRegex = /^until (.*) from (today|now)/i;
    let untilFromMatch = endingDateTimeText.match(untilFromRegex);
    if (untilFromMatch != null) {
        return endingDateTimeText.replace(untilFromRegex, "in $1");
    }

    let untilRegex = /^until (on|at )?(.*)/i;
    let untilMatch = endingDateTimeText.match(untilRegex);
    if (untilMatch != null) {
        if(!!untilMatch[1]) {
            return endingDateTimeText.replace(untilRegex, "$1$2");
        }
        else {
            return endingDateTimeText.replace(untilRegex, "on $2");
        }
    }
    let forRegex = /^for (.*)/i;
    let forMatch = endingDateTimeText.match(forRegex);
    if (forMatch != null) {
        return endingDateTimeText.replace(forRegex, "in $1");
    }
    throw "Couldn't parse endingDateTimeText";
}

/**
 * parses the date after "until"
 * returns:
 * {
 *     newReminderDateTimeText: <reminderDateTimeText without the ending condition>, 
 *     endingConditionDate: <moment object>
 * }
 */
function _getEndingDateTime(reminderDateTimeText, userTimezone) {
    let delimiterMatch = reminderDateTimeText.match(/ (until|for) /i);
    if (delimiterMatch == null) {
        return null;
    }
    // remove everything before the delimiter (but keep the delimiter)
    let endingDateTimeText = reminderDateTimeText.substr(delimiterMatch.index).trim();
    let endingConditionDate;
    try {
        endingDateTimeText = _convertEndingDateTimeTextToReminderDateTimeText(endingDateTimeText);
        endingConditionDate = parseNonRecurringSingleDate.parseNonRecurringSingleDate(endingDateTimeText, userTimezone);
    } catch (err) {
        throw "Couldn't parse ending condition";
    }
    return {
        newReminderDateTimeText: reminderDateTimeText.substr(0, delimiterMatch.index).trim(),
        endingConditionDate: endingConditionDate,
    };
}

/**
 * parses recurring dates
 * @param  {String} reminderDateTimeText example: "every sunday, monday at 2 pm, 3 pm"
 * @return {[String]} example: ["on sunday at 2 pm", "on sunday at 3 pm", "on monday at 2 pm", "on monday at 3 pm"]
 */
function parseRecurringDates(reminderDateTimeText, userTimezone) {
    if (!reminderDateTimeText.match(/\bevery\b/i)) {
        return null;
    }
    // check if there is a condition for ending
    let endingDateTimeResult = _getEndingDateTime(reminderDateTimeText, userTimezone);
    let endingConditionDate;
    if (endingDateTimeResult) {
        reminderDateTimeText = endingDateTimeResult.newReminderDateTimeText;
        endingConditionDate = endingDateTimeResult.endingConditionDate;
    }

    let recurringDates = [];
    // /remindme every monday, tuesday at 8am, 3 pm and wednesday at 2 pm -> {"monday, tuesday": ["at 8 am", "at 3 pm"]
    //  , "wednesday": "at 2 pm"}
    let dateTextToTimesMap = utils.getDateToParsedTimesFromReminderDateTime(reminderDateTimeText);

    for(let dateText in dateTextToTimesMap) {
        let times = dateTextToTimesMap[dateText];
        let dates = _getRecurringDates(dateText);
        if (!dates || !dates.length) {
            return null;
        }
        
        // if there was no time provided, then its just the dates
        if (!times || !times.length) {
            recurringDates.push(...dates);
        }
        // otherwise return [dates]x[times]
        else {
            for (let date of dates) {
                for (let time of times) {
                    recurringDates.push(date + " " + time);
                }
            }
        }
    }

    return {
        recurringDates: [... new Set(recurringDates)],
        endingConditionDate: endingConditionDate,
    };
}
module.exports = {
    parseRecurringDates: parseRecurringDates,
    // exported only for unit tests
    _getRecurringDates: _getRecurringDates,
};