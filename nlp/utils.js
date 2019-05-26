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
    //  1- remove any "and" or ","
    //  2- find time parts using TIME_REGEX
    //  3- everything else is DateParts, split by TIME_REGEX
    //  4- create the map from date(s) -> time(s)
    
    // remove any "and" or ","
    str = str
        .replace(/\band\b|,/g, " ")
        .replace(/ {1,}/g, " ");

    const TIME_REGEX = new RegExp(`at\\b(${TIME_NUMBER_REGEX}|${MERIDIEM_REGEX}|at|\\s)+`, 'g');
    let timeParts = str.match(TIME_REGEX);
    if(!!timeParts) {
        timeParts = timeParts.map(x => x.trim());
    }
    else {
        timeParts = [];
    }

    let dateParts = str
        .replace(TIME_REGEX, "|||")
        .split("|||")
        .filter(x => !!x) // remove any undefined elements
        .map(x => x.trim().replace(/ {1,}/g, " ")) // trim and remove double spaces
        .filter(x => !!x.length); // remove any empty elements in the list

    // create the map and return
    let dateToTimeMap = {};
    for (let i = 0; i < Math.max(timeParts.length, dateParts.length); i++) {
        if (i == timeParts.length) {
            dateToTimeMap[dateParts[i]] = [];
        }
        else {
            dateToTimeMap[dateParts[i]] = timeParts[i];
        }
    }
    return dateToTimeMap;
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

    return dateToParsedTimesMap;
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
    // only exported for unit tests
    _parseTimesStringToArray: _parseTimesStringToArray,
};