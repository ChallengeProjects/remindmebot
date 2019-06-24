const commonTypos = require("./commonTypos.json"),
    parseRecurringDates = require("./parseRecurringDates.js"),
    parseNonRecurringSingleDate = require("./parseNonRecurringSingleDate.js"),
    utils = require("./utils.js"),
    errorCodes = require("./errorCodes.js"),
    translationMaps = require("./translationMaps.json"),
    { wordsToNumbers } = require('words-to-numbers');


// logger = require("./logger.js");
// 
/**
 * splits user's command from the "to" or "that" delimiter into a datetime part and a text part
 * @param  {string} text user's text in format of "/remindme <datetime/time interval> to <text>"
 * @return {reminderText: <text>, reminderDateTimeText: <datetime/time interval>}
 * Example: /remindme to/every ... at ... to abcdef -> 
 * { reminderText: "abcdef", reminderDateTimeText: "to/every ... at ..."}
 */
function _splitReminderText(text) {
    // get the index of the first delimiter
    const SPLIT_DELIMITERS = {
        TO: "to".toLowerCase(),
        THAT: "that".toLowerCase(),
        DI: "di".toLowerCase(), // "to" in Italian
        CHE: "che".toLowerCase(), // "that" in Italian
    };
    // words in reminder date time text (am, pm, months)
    const ITALIAN_DI_PREFIXES = ["sera", "mattina", "pomeriggio", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio",
        "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"].map(x => x.toLowerCase());
    // Find the minimum index of any split delimiter
    let selectedSplitDelimiterIndex = Number.MAX_VALUE;
    let selectedSplitDelimiter = null;
    for (let splitDelimiter of Object.values(SPLIT_DELIMITERS)) {
        let matchResult = text.match(new RegExp(`\\b${splitDelimiter}\\b`, 'i'));
        if(!matchResult) {
            continue;
        }
        
        // Make sure its not the italian edge case "di Genanio" -> "of january"
        if(splitDelimiter == SPLIT_DELIMITERS.DI) {
            let foundIt = false;
            // Get 2 words starting from the "Di"
            // Example: "/r il 21 di Maggio alle 17.57 di andare a fare la spesa" ->
            //  ["di Maggio",  "di andare"] 
            // let test = text.slice(matchResult.index).split(" ").slice(0, 2).join(" ");
            let testRegexMatches = text.match(new RegExp(`\\bdi ([^ ]+)\\b`, 'ig'));
            for(let match of testRegexMatches) {
                // take the match without the italian month
                let secondWord = match.split(" ")[1];
                if(ITALIAN_DI_PREFIXES.indexOf(secondWord.toLowerCase()) == -1) {
                    matchResult = text.match(new RegExp(`\\b${match}\\b`, 'i'));
                    foundIt = true;
                    break; // dont continue to the next "Di"
                }
            }
            if(!foundIt) {
                continue;
            }
        }
        
        let currentIndex = matchResult.index;
        if (currentIndex < selectedSplitDelimiterIndex) {
            selectedSplitDelimiter = splitDelimiter;
            selectedSplitDelimiterIndex = currentIndex;
        }
    }

    if (selectedSplitDelimiterIndex == Number.MAX_VALUE) {
        throw errorCodes.NO_DELIMITER_PROVIDED;
    }

    let reminderText = text.slice(selectedSplitDelimiterIndex + selectedSplitDelimiter.length);
    let reminderDateTimeText = text.slice(text.indexOf(" ") + 1, selectedSplitDelimiterIndex); // ignore the first word (the command /remindme)

    return {
        reminderText: reminderText.trim(),
        reminderDateTimeText: reminderDateTimeText.trim()
    };
}

function _correctSpellingForDateTimeText(reminderDateTimeText) {
    reminderDateTimeText = wordsToNumbers(reminderDateTimeText);
    
    for (let correctWord in commonTypos) {
        for (let incorrectWord of commonTypos[correctWord]) {
            reminderDateTimeText = reminderDateTimeText.replace(new RegExp(`\\b${incorrectWord}\\b`, 'ig'), correctWord);
        }
    }

    // x.xx-> x:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-9])]\.([0-5][0-9])\b/g, "$1 $2:$3");
    // xx.xx->xx:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-1][0-9]|2[0-4])\.([0-5][0-9])\b/g, "$1 $2:$3");

    // xxx-> x:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-9])([0-5][0-9])\b/g, "$1 $2:$3");
    // xxxx->xx:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-1][0-9]|2[0-4])([0-5][0-9])\b/g, "$1 $2:$3");

    // "at x"/"at xx" -> "at x:00"/"at xx:00"
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|until) ([0-1][0-9]|2[0-4])([^:]|$)/g, "$1 $2:00");

    // 10w -> 10 weeks,10 w -> 10 weeks
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)w\b/ig, "$1 weeks");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)d\b/ig, "$1 days");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)h\b/ig, "$1 hours");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)m\b/ig, "$1 minutes");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)s\b/ig, "$1 seconds");
    return reminderDateTimeText;
}

function _translate(reminderDateTimeText) {
    function __convertAccents(reminderDateTimeText) {
        const ACCENTS_MAP = {
            'i': ['î', 'ï', 'í', 'ī', 'į', 'ì'],
            'e': ['è', 'é', 'ê', 'ë', 'ē', 'ė', 'ę'],
            'o': ['ô', 'ö', 'ò', 'ó', 'œ', 'ø', 'ō', 'õ'],
            'u': ['û', 'ü', 'ù', 'ú', 'ū'],
            'a': ['à', 'á', 'â', 'ä', 'ã', 'å', 'ā'],
        };
        
        for(let englishLetter in ACCENTS_MAP) {
            let accents = ACCENTS_MAP[englishLetter];
            for(let accent of accents) {
                reminderDateTimeText = reminderDateTimeText.replace(new RegExp(accent, 'g'), englishLetter);
            }
        }
        return reminderDateTimeText;
    }

    function __transliterate(reminderDateTimeText) {
        for (let foreignLanguage in translationMaps) {
            let foreignLanguageMap = translationMaps[foreignLanguage];
            for (let foreignLanguageWord in foreignLanguageMap) {
                let englishWord = foreignLanguageMap[foreignLanguageWord];
                reminderDateTimeText = reminderDateTimeText.replace(new RegExp(`\\b${foreignLanguageWord}\\b`, 'ig'), englishWord);
            }
        }
        return reminderDateTimeText;
    }
    
    // Only italian right now
    function __specialTranslations(reminderDateTimeText) {
        // Morning at <time>
        reminderDateTimeText = reminderDateTimeText.replace(/\bmattina alle ([0-9:]+)/ig, 'at $1 am');
        // Afternoon at <time>
        reminderDateTimeText = reminderDateTimeText.replace(/\bpomeriggio alle ([0-9:]+)/ig, 'at $1 pm');
        // Night at <time>
        reminderDateTimeText = reminderDateTimeText.replace(/\bsera alle ([0-9:]+)/ig, 'at $1 pm');
        return reminderDateTimeText;
    }

    reminderDateTimeText = __convertAccents(reminderDateTimeText);
    reminderDateTimeText = __specialTranslations(reminderDateTimeText);
    reminderDateTimeText = __transliterate(reminderDateTimeText);
    return reminderDateTimeText;
}

function preProcessReminderDateTimeText(reminderDateTimeText) {
    // remove double spaces from text
    reminderDateTimeText = reminderDateTimeText.replace(/ {1,}/g, " ");
    reminderDateTimeText = reminderDateTimeText.trim();

    reminderDateTimeText = reminderDateTimeText.replace(/([^\s]),([^\s])/g, "$1, $2");
    // 1- correct spelling first so you can translate
    // 2- translate
    // 3- call correctSpelling again because some mappings happen like "week days" or "at 1757" -> "at 17:57"
    reminderDateTimeText = _correctSpellingForDateTimeText(reminderDateTimeText);
    reminderDateTimeText = _translate(reminderDateTimeText);
    reminderDateTimeText = _correctSpellingForDateTimeText(reminderDateTimeText);

    return reminderDateTimeText;
}

function getDate(text, userTimezone) {
    // remove double spaces from text
    text = text.replace(/ {1,}/g, " ");
    text = text.trim();
    let { reminderText, reminderDateTimeText } = _splitReminderText(text);
    
    reminderDateTimeText =  preProcessReminderDateTimeText(reminderDateTimeText);

    let recurringDatesResult = null;

    try {
        recurringDatesResult = parseRecurringDates.parseRecurringDates(reminderDateTimeText, userTimezone);
    } catch(err) {
        () => {}; // no-op so eslint doesnt complain
    }

    if (recurringDatesResult) {
        let recurringDates = recurringDatesResult.recurringDates;
        let endingConditionDate = recurringDatesResult.endingConditionDate;
        return {
            reminderText: reminderText,
            reminderDates: {
                recurringDates: recurringDates,
                endingConditionDate: endingConditionDate,
            }
        };
    }
    else {
        let dateToTimesMap = utils.getDateToParsedTimesFromReminderDateTime(reminderDateTimeText);
        
        // Compute cross product for each date
        let parsedDates = [];
        for(let date in dateToTimesMap) {
            if(!dateToTimesMap[date].length) {
                let parsedDate = parseNonRecurringSingleDate.parseNonRecurringSingleDate(date, userTimezone);
                parsedDates.push(parsedDate);
            }
            else {
                for(let time of dateToTimesMap[date]) {
                    let dateTimeText = date + " " + time;
                    let parsedDate = parseNonRecurringSingleDate.parseNonRecurringSingleDate(dateTimeText, userTimezone);
                    parsedDates.push(parsedDate);
                }
            }
        }
        
        return {
            reminderText: reminderText,
            reminderDates: { dates: parsedDates }
        };
    }
}
/*
TESTS:
all of this logic has nothing to do when you specify a period of time "in", this only works with "on" or "at"
saturday at 4pm should be next saturday if today is saturday
4pm should be tomorrow 4 pm if 4pm has already passed today
*/

module.exports = {
    getDate: getDate,
    //only exported for unit tests
    _splitReminderText: _splitReminderText,
    preProcessReminderDateTimeText: preProcessReminderDateTimeText,
};