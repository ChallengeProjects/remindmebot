const commonTypos = require("./commonTypos.json"),
    parseRecurringDates = require("./parseRecurringDates.js"),
    utils = require("./utils.js"),
    errorCodes = require("./errorCodes.js"),
    translationMaps = require("./translationMaps.json"),
    // one,two,three -> 1,2,3
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

function _escapeRegExp(string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function _splitReminderText(text) {
    let delimiters = ['[0-9]+', ':', '-', '/', ',', ' '];
    function _removeDelimiter(reminderText) {
        let words = reminderText.split(/\s/).filter(x => !(x == ""));
        // if first word is a reminder datetime/text delimiter, skip it
        if (["to", "that", "about"].indexOf(words[0].toLowerCase()) != -1) {
            return reminderText.substr(words[0].length+1);
        }
        else {
            return reminderText;
        }
    }
    function _guessDelimimterIndex(str) {
        let delimitersRegex = new RegExp(`(${delimiters.join("|")})`, 'i');
        let els = str.split(delimitersRegex).filter(x => !(x == ""));
        let firstNonDateTimeWord;
        let lastDelimiters = [];
        for (let i in els) {
            let el = els[i];
            // save any delimiters in case it was followed by a non datetime word
            // then append it at the end
            if (el.match(/^(and|[0-9]+|:|-|\/|\.|,)$/ig)) {
                lastDelimiters.push(el);
            }
            else if (!el.match(/^(today|tomorrow|tommorrow|tommorow|am|pm|a\.m|p\.m|a\.m\.|p\.m\.|\.|every|everyday|in|on|at|until|the|after|next|this|and|st|nd|rd|th|january|february|march|april|may|june|july|august|september|october|november|december|noon|of|morning|tonight|night|evening|afternoon|a|an)$/ig)
                && !el.match(/^(weekday|weekend|sunday|monday|tuesday|wednesday|thursday|friday|saturday|second|minute|hour|day|week|month|year)s?$/ig)
                && el != " ") {
                firstNonDateTimeWord = lastDelimiters.join('') + el;
                break;
            }
            else {
                lastDelimiters = [];
            }
        }
        
        if (!firstNonDateTimeWord) {
            throw 'NO_GUESS_FOUND';
        }
        
        let wordMatch = str.match(new RegExp(`(^|\\s)(${_escapeRegExp(firstNonDateTimeWord)})(${delimiters.join("|")}|\\s|$)`, 'i'));
        return {
            // have to use ^|\\s instead of \b because the word can contain delimiters (for example firstNonDateTimeWord =".")
            selectedSplitDelimiterIndex: wordMatch.index,
            firstWord: wordMatch[2],
        };
    }

    let reminderText;
    let reminderDateTimeText;

    try {
        let preProcessedText = preProcessReminderDateTimeText(text);
        // remove first word "/r","remind","r","fkrny",..
        preProcessedText = preProcessedText.split(" ").slice(1).join(" ");
        // remove "me" ("/r me", "remind me")
        if (!!preProcessedText.match(/^me /)) {
            preProcessedText = preProcessedText.split(" ").slice(1).join(" ");
        }
        let { selectedSplitDelimiterIndex, firstWord } = _guessDelimimterIndex(preProcessedText);
        reminderDateTimeText = preProcessedText.slice(0, selectedSplitDelimiterIndex);
        // have to use ^|\\s instead of \b because the word can contain delimiters (for example firstWord =".")
        reminderText = text.substr(text.match(new RegExp(`(^|\\s)${_escapeRegExp(firstWord)}(${delimiters.join("|")}|\\s|$)`, 'i')).index);
        reminderText = _removeDelimiter(reminderText);
    } catch (err) {
        throw 'NO_GUESS_FOUND';
    }


    return {
        reminderText: reminderText.trim(),
        reminderDateTimeText: reminderDateTimeText.trim()
    };
}

function _correctSpellingForDateTimeText(reminderDateTimeText) {
    // stupid library converting "second" -> "2", in "/r in every second"
    // temp fix until i find another library
    const SECOND_TEMP_REPLACEMENT = "∞§¶";
    reminderDateTimeText = reminderDateTimeText.replace(/((?:every|in)? ([.0-9] )?)second\b/, "$1" + SECOND_TEMP_REPLACEMENT);
    // one,two,three -> 1,2,3
    reminderDateTimeText = wordsToNumbers(reminderDateTimeText);
    reminderDateTimeText = reminderDateTimeText.replace(SECOND_TEMP_REPLACEMENT, "second");

    // Now fix the typos
    for (let correctWord in commonTypos) {
        for (let incorrectWord of commonTypos[correctWord]) {
            reminderDateTimeText = reminderDateTimeText.replace(new RegExp(`\\b${incorrectWord}\\b`, 'ig'), correctWord);
        }
    }

    // x.xx-> x:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-9])\.([0-5][0-9])(am|pm|\b)/g, "$1 $2:$3$4");
    // xx.xx->xx:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-1][0-9]|2[0-4])\.([0-5][0-9])(am|pm|\b)/g, "$1 $2:$3$4");
    // xxx-> x:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-9])([0-5][0-9])(am|pm|\b)/g, "$1 $2:$3$4");
    // xxxx->xx:xx
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|on|until) ([0-1][0-9]|2[0-4])([0-5][0-9])(am|pm|\b)/g, "$1 $2:$3$4");

    // "at x"/"at xx" -> "at x:00"/"at xx:00"
    reminderDateTimeText = reminderDateTimeText.replace(/\b(at|until) ([0-1][0-9]|2[0-4])([^:]|$)/g, "$1 $2:00$3");
    // 10w -> 10 weeks,10 w -> 10 weeks
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)w\b/ig, "$1 weeks");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)d\b/ig, "$1 days");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)h\b/ig, "$1 hours");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)m\b/ig, "$1 minutes");
    reminderDateTimeText = reminderDateTimeText.replace(/\b([0-9]+)( ?)s\b/ig, "$1 seconds");
    return reminderDateTimeText;
}

function _translate(reminderDateTimeText) {
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

    reminderDateTimeText = __transliterate(reminderDateTimeText);
    return reminderDateTimeText;
}

function _convertFractionUnitsToIntegers(reminderDateTimeText) {
    let map = {
        'second': { factor: 1, nextUnit: 'seconds' },
        'seconds': { factor: 1, nextUnit: 'seconds' },
        'minute': { factor: 60, nextUnit: 'seconds' },
        'minutes': { factor: 60, nextUnit: 'seconds' },
        'hour': { factor: 60, nextUnit: 'minutes' },
        'hours': { factor: 60, nextUnit: 'minutes' },
        'day': { factor: 24, nextUnit: 'hours' },
        'days': { factor: 24, nextUnit: 'hours' },
        'week': { factor: 7, nextUnit: 'days' },
        'weeks': { factor: 7, nextUnit: 'days' },
        'month': { factor: 4, nextUnit: 'weeks' },
        'months': { factor: 4, nextUnit: 'weeks' },
        'year': { factor: 52, nextUnit: 'weeks' },
        'years': { factor: 52, nextUnit: 'weeks' },
    };
    let units = Object.keys(map);

    let regexMatches = reminderDateTimeText.match(new RegExp(`\\b(every|in) ([.0-9]+) (${units.join("|")})\\b`, 'ig'));
    regexMatches = regexMatches || [];
    for (let regexMatch of regexMatches) {
        // only if there is a number
        if (!!regexMatch.match(/.*[.0-9]+.*/)) {
            let prefix = regexMatch.split(" ")[0];
            let number = parseFloat(regexMatch.split(" ")[1]);
            let unit = regexMatch.split(" ")[2];
            // if its a fraction
            if (number != parseInt(number)) {
                number = Math.round(number * map[unit].factor);
                unit = map[unit].nextUnit;
            }
            let regexMatchReplacement = prefix + " " + number + " " + unit;
            reminderDateTimeText = reminderDateTimeText.replace(regexMatch, regexMatchReplacement);
        }
    }
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

    reminderDateTimeText = _convertFractionUnitsToIntegers(reminderDateTimeText);

    return reminderDateTimeText;
}

function getDate(text, userTimezone) {
    // remove double spaces from text
    text = text.replace(/ {1,}/g, " ");
    text = text.trim();
    
    let { reminderText, reminderDateTimeText } = _splitReminderText(text);
    reminderDateTimeText = preProcessReminderDateTimeText(reminderDateTimeText);

    let recurringDatesResult = null;

    try {
        recurringDatesResult = parseRecurringDates.parseRecurringDates(reminderDateTimeText, userTimezone);
    } catch (err) {
        () => {}; // no-op so eslint doesnt complain
    }

    if (recurringDatesResult) {
        let recurringDates = recurringDatesResult.recurringDates;
        let endingConditionDate = recurringDatesResult.endingConditionDate;
        if (!recurringDates || !recurringDates.length) {
            throw errorCodes.UNKOWN_ERROR;
        }
        return {
            reminderText: reminderText,
            reminderDates: {
                recurringDates: [...new Set(recurringDates)],
                endingConditionDate: endingConditionDate,
            }
        };
    } else {
        let nlpContainers = utils.getNLPContainersFromReminderDateTimeText(reminderDateTimeText);

        let parsedDates = nlpContainers
            .map(nlpContainer => nlpContainer.getMomentDate(userTimezone));

        if (!parsedDates || !parsedDates.length) {
            throw errorCodes.UNKOWN_ERROR;
        }
        return {
            reminderText: reminderText,
            reminderDates: { dates: parsedDates }
        };
    }
}

module.exports = {
    getDate: getDate,
    //only exported for unit tests
    _splitReminderText: _splitReminderText,
    _convertFractionUnitsToIntegers: _convertFractionUnitsToIntegers,
    preProcessReminderDateTimeText: preProcessReminderDateTimeText,
};