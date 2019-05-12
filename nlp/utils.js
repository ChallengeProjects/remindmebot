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
    let words = timePart.split(" ")
        .slice(1).join(" ") // remove the "at"
        .replace(new RegExp(`(${TIME_NUMBER_REGEX})(${MERIDIEM_REGEX})`, 'gi'), "$1 $2") // seperate numbers joined with am/pm
        .replace(/(,|\band\b)/ig, " ") // replace "," or "and" with " "
        .split(" ").filter(x => !!x.length); // split again to an array and remove all empty strings
    return words;
}



// "on 2/3 at 2,3,4 pm" -> ["at 2,3,4 pm"]
// "every monday at 2 am, 2 pm and 3 pm and tuesday at 4 pm" -> ["at 2 am, 2 pm and 3 pm", " at 4 pm"]
function getDateToTimePartsMapFromReminderDateTimeText(str) {
    function _isAtSegmentATimePart(words) {
        // make sure all "words" in the atSegment only contain "time words"
        for (let word of words) {
            // each word has to either be either time number or meridiem
            if(!isTimeNumber(word) && !isMeridiem(word)) {
                return false;
            }
        }
        return true;
    }
    let timeParts = [];
    let dateParts = [];
    const DELIMITERS = ["on", "every", "and", ",", "at"];

    // "on 2/3 at 2,3,4" -> ["2/3","2","3, "4"]
    // "every monday at 2 am, 2 pm and 3 pm and tuesday at 4 pm
    //  -> ["monday", "2 am", "2 pm", "3 pm", "tuesday", " 4 pm"]
    // Now I need to combine the consecutive timie parts

    let atSegments = str
        .split(new RegExp(`\\b(${DELIMITERS.join("|")})\\b`, 'ig'))
        .map(x => x.trim())
        .filter(x => !!x.length); // make sure no empty string is in the list

    let consecutiveAtTimeSegments = [];
    let consecutiveAtDateSegments = [];
    const DATE_PARTS_DELIMITER = " ";
    const TIME_PARTS_DELIMITER = ", ";
    for (let atSegment of atSegments) {
        let words = _parseTimesStringToArray("at " + atSegment);

        if(_isAtSegmentATimePart(words)) {
            consecutiveAtTimeSegments.push(atSegment.trim());
            if(consecutiveAtDateSegments.length) {
                dateParts.push(consecutiveAtDateSegments.join(DATE_PARTS_DELIMITER));
                consecutiveAtDateSegments = [];
            }
        }
        else {
            if(consecutiveAtTimeSegments.length) {
                timeParts.push("at " + consecutiveAtTimeSegments.join(TIME_PARTS_DELIMITER));
                consecutiveAtTimeSegments = [];
            }
            consecutiveAtDateSegments.push(atSegment.trim());
        }
    }
    // Add anything we didnt clear at the end
    if(consecutiveAtTimeSegments.length) {
        timeParts.push("at " + consecutiveAtTimeSegments.join(TIME_PARTS_DELIMITER));
    }
    if(consecutiveAtDateSegments.length) {
        dateParts.push(consecutiveAtDateSegments.join(DATE_PARTS_DELIMITER));
    }

    // any element in dateParts or timeParts might have a delimiter hanging loose(on/every/at/in)
    // we need to remove it here
    function _removeHangingLooseDelimiters(parts, delimiter) {
        for(let i = 0; i < parts.length; i++) {
            let part = parts[i];
            let partsSplit = part.split(delimiter);
            while(true) {
                let lastElement = partsSplit[partsSplit.length - 1];
                if(lastElement.match(new RegExp(`^(${DELIMITERS.join("|")})$`, 'i'))) {
                    partsSplit.pop();
                }
                else {
                    parts[i] = partsSplit.join(delimiter);
                    break;
                }
            }
        }
        return parts;
    }
    timeParts = _removeHangingLooseDelimiters(timeParts, TIME_PARTS_DELIMITER);
    dateParts = _removeHangingLooseDelimiters(dateParts, DATE_PARTS_DELIMITER);

    // create the map and return
    let dateToTimeMap = {};
    for(let i = 0; i < Math.max(timeParts.length, dateParts.length); i++) {
        if(i == timeParts.length) {
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
    
    for(let date in dateToTimeMap) {
        let timePart = dateToTimeMap[date];
        if(!timePart.length) {
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
        for(let i = 0; i < timesPartsOfWords.length; i++) {
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