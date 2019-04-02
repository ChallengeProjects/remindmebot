function _getTimePartFromString(str) {
    let atSegments = str.replace(/\b(on)\b/g, "at").split("at").filter(x => !!x.length);
    for(let atSegment of atSegments) {
        let words = atSegment.replace(/,/g, " ").replace(/([0-9]+)(am|pm)/g, "$1 $2").split(" ").filter(x => !!x.length);

        let flag = true;
        for(let word of words) {
            // each word has to either be a number with colons in between or "am" "pm" or "and"
            if(!word.match(/^[0-9:]+$/i) && !word.match(/^(am|pm|and)$/i)) {
                flag = false;
            }
        }
        if(flag) {
            return "at " + atSegment.trim();
        }
    }

    return null;
}

function getTimesFromString(str) {
    let times = [];
    let timePartFromString = _getTimePartFromString(str);

    //if nothing
    if(!timePartFromString) {
        return null;
    }

    // if no recurrence
    if(timePartFromString.indexOf(",") == -1 && !timePartFromString.match(/\band\b/i)) {
        return [timePartFromString];
    }

    // str = "3 4 pm " [3, 4, pm]
    // str = "3 am, 4 pm" [3, am, 4, pm]
    let words = timePartFromString.split(" ")
        .slice(1).join(" ")    // remove the "at"
        .replace(/([0-9]+)(am|pm)/g, "$1 $2") // seperate numbers joined with am/pm
        .replace(/\band\b/ig, " ") // replace "and" with " "
        .replace(/,/g, " ")    // replace "," with " "
        .split(" ").filter(x => !!x.length); // split again to an array and remove all empty strings

    let tempArrayUntilMeridiem = [];
    for(let word of words) {
        // if this word is a meridiem then process it and clear it
        if(word.match(/^(am|pm)$/i)) {
            let meridiem = word;
            for(let tempWord of tempArrayUntilMeridiem) {
                times.push("at " + tempWord + " " + meridiem);
            }
            tempArrayUntilMeridiem = [];
        }
        else {
            tempArrayUntilMeridiem.push(word);
        }
    }
    
    return times;
}

/**
 * Simply remove the time part of the string
 * @return {String} date part of the string
 * Example: 
 */
function getDatePartFromString(reminderDateTimeText) {
    let timePartFromString = _getTimePartFromString(reminderDateTimeText);
    if(!timePartFromString) {
        return reminderDateTimeText;
    }

    return reminderDateTimeText.replace(_getTimePartFromString(reminderDateTimeText), "").trim();
}

module.exports = {
    getDatePartFromString: getDatePartFromString,
    getTimesFromString: getTimesFromString,
};