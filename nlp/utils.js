function getTimePartFromString(str) {
    // example: "on 2/3 at 2,3,4" -> ["2/3","2,3,4"]
    let atSegments = str
        .replace(/\b(on)\b/ig, "at") //replace every on with at
        .split("at") // split by at
        .filter(x => !!x.length); // make sure no empty string is in the list

    for(let atSegment of atSegments) {
        let words = atSegment
            .replace(/,/g, " ") // replace all commas with spaces so we can split by them
            .replace(/([0-9]+)(am|pm)/g, "$1 $2") // add spacing between number and am|pm
            .split(" ") // split
            .filter(x => !!x.length); // make sure no string is empty in the list

        // make sure all "words" in the atSegment only contain "time words"
        let flag = true;
        for(let word of words) {
            // each word has to either be a number with colons in between or "am" "pm" or "and"
            if(!word.match(/^[0-9:]+$/i) && !word.match(/^(am|pm|and)$/i)) {
                flag = false;
                break;
            }
        }
        // if flag is still true, this means that everything was "time compliant"
        //  so that was a true atSegment and we can return that
        if(flag) {
            return "at " + atSegment.trim();
        }
    }

    return null;
}

// example: "on 02/03 at 2, 3 and 4 pm and 5 am" -> ["2 pm", "3 pm", "4 pm", "5 am"]
function getTimesFromString(str) {
    let times = [];
    let timePartFromString = getTimePartFromString(str);

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
 */
function getDatePartFromString(reminderDateTimeText) {
    let timePartFromString = getTimePartFromString(reminderDateTimeText);
    if(!timePartFromString) {
        return reminderDateTimeText;
    }

    return reminderDateTimeText.replace(timePartFromString, "").trim();
}

module.exports = {
    getDatePartFromString: getDatePartFromString,
    getTimesFromString: getTimesFromString,
    getTimePartFromString: getTimePartFromString,
};