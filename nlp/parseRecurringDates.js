const utils = require('./utils.js');

// convert recurring date to re-processable date
// NLPInterval(2, 'days') -> "in 2 days"
// NLPInterval(undefined, 'wednesday') -> "in wednesday"
function _convertRecurringDate(nlpContainer) {
    let nlpInterval = nlpContainer.getNLPInterval();
    let text = "";
    if (!!nlpInterval) {
        if (nlpInterval.numberOrNext == 'next') {
            // this should never happen
            text = `next ${nlpInterval.unit}`;
        }
        else {
            text = `in ${nlpInterval.numberOrNext || 1} ${nlpInterval.unit}`;
        }
        
    }
    let nlpDate = nlpContainer.getNLPDate();
    if (!!nlpDate && !!nlpDate.day) {
        let suffix = "th";
        let map = {1: "st", 2: "nd", 3: "rd"};
        if (nlpDate.day in map) {
            suffix = map[nlpDate.day];
        }
        text = `on the ${nlpDate.day}${suffix}`;
    }

    let nlpTime = nlpContainer.getNLPTime();
    if (!nlpTime) {
        return text;
    }
    if (!!text) {
        text += " ";
    }
    text += "at " + nlpTime.getTextRepresentation();
    return text;
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
        let nlpContainer = utils.getNLPContainersFromReminderDateTimeText(endingDateTimeText)[0];
        endingConditionDate = nlpContainer.getMomentDate(userTimezone);
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
    if (!reminderDateTimeText.match(/\bevery\b/i) && !reminderDateTimeText.match(/\b(hourly|daily|weekly|monthly)\b/i)) {
        return null;
    }
    // check if there is a condition for ending and remove it from reminderDateTimeText
    let endingDateTimeResult = _getEndingDateTime(reminderDateTimeText, userTimezone);
    let endingConditionDate;
    if (endingDateTimeResult) {
        reminderDateTimeText = endingDateTimeResult.newReminderDateTimeText;
        endingConditionDate = endingDateTimeResult.endingConditionDate;
    }
    let recurringDates = [];
    // /remindme every monday, tuesday at 8am, 3 pm and wednesday at 2 pm -> {"monday, tuesday": ["at 8 am", "at 3 pm"]
    //  , "wednesday": "at 2 pm"}
    let allNLPContainers = utils.getNLPContainersFromReminderDateTimeText(reminderDateTimeText);
    for(let nlpContainer of allNLPContainers) {
        recurringDates.push(_convertRecurringDate(nlpContainer));
    }

    return {
        recurringDates: [... new Set(recurringDates)],
        endingConditionDate: endingConditionDate,
    };
}
module.exports = {
    parseRecurringDates: parseRecurringDates,
    // exported only for unit tests
    _convertRecurringDate: _convertRecurringDate,
};