const TIME_NUMBER_REGEX = '[0-9:]+';
const MERIDIEM_REGEX = '(a\.?m\.?|p\.?m\.?)';

function isTimeNumber(word) {
    return !!word.match(new RegExp(`^${TIME_NUMBER_REGEX}$`));
}
function isMeridiem(word) {
    return !!word.match(new RegExp(`^${MERIDIEM_REGEX}$`, 'i'));
}

// "at 3" -> ["3"]
// "at 3 4 pm " -> ["3", "4", "pm"]
// "at 3 am, 4 pm" -> ["3", "am", "4", "pm"]
function parseTimesStringToArray(timePartFromString) {
    let words = timePartFromString.split(" ")
        .slice(1).join(" ") // remove the "at"
        .replace(new RegExp(`(${TIME_NUMBER_REGEX})(${MERIDIEM_REGEX})`, 'gi'), "$1 $2") // seperate numbers joined with am/pm
        .replace(/(,|\band\b)/ig, " ") // replace "," or "and" with " "
        .split(" ").filter(x => !!x.length); // split again to an array and remove all empty strings
    return words;
}

function getTimePartFromString(str) {
    // example: "on 2/3 at 2,3,4" -> ["2/3","2,3,4"]
    let atSegments = str
        .replace(/\b(on)\b/ig, "at") //replace every on with at
        .split("at") // split by at
        .filter(x => !!x.length); // make sure no empty string is in the list

    for (let atSegment of atSegments) {
        let words = parseTimesStringToArray("at " + atSegment);

        // make sure all "words" in the atSegment only contain "time words"
        let flag = true;
        for (let word of words) {
            // each word has to either be either time number or meridiem
            if(!isTimeNumber(word) && !isMeridiem(word)) {
                flag = false;
                break;
            }
        }
        // if flag is still true, this means that everything was "time compliant"
        //  so that was a true atSegment and we can return that
        if (flag) {
            return "at " + atSegment.trim();
        }
    }

    return null;
}

// example: "on 02/03 at 2, 3 and 4 pm and 5 am" -> ["at 2 pm", "at 3 pm", "at 4 pm", "at 5 am"]
function getTimesFromReminderDateTime(str) {
    let times = [];
    let timePartFromString = getTimePartFromString(str);

    //if nothing
    if (!timePartFromString) {
        return null;
    }

    let words = parseTimesStringToArray(timePartFromString);

    // walk through the array until u find a meridiem, append the meridiem to the time and push it to the array
    let tempArrayUntilMeridiem = [];
    for (let word of words) {
        // if this word is a meridiem then process it for all the numbers we pushed and clear the array
        if (isMeridiem(word)) {
            let meridiem = word;
            for (let tempWord of tempArrayUntilMeridiem) {
                times.push("at " + tempWord + " " + meridiem);
            }
            tempArrayUntilMeridiem = [];
        } else {
            tempArrayUntilMeridiem.push(word);
        }
    }

    return times;
}

/**
 * Simply remove the time part of the string
 * @return {String} date part of the string
 */
function getDatePartFromString(reminderDateTimeText) {
    let timePartFromString = getTimePartFromString(reminderDateTimeText);
    if (!timePartFromString) {
        return reminderDateTimeText;
    }

    return reminderDateTimeText.replace(timePartFromString, "").trim();
}

module.exports = {
    getDatePartFromString: getDatePartFromString,
    getTimesFromReminderDateTime: getTimesFromReminderDateTime,
    getTimePartFromString: getTimePartFromString,
};