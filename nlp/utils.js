const moment = require('moment-timezone'),
    { NLPContainer, NLPDate, NLPTime, NLPInterval } = require("./models/date.js"),
    timeutils = require("./timeutils.js");

const LOWERCASE_MONTHS = moment.months().map(m => m.toLowerCase());
const WEEKDAY_UNITS =  ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const TIME_UNITS = ['second', 'minute', 'hour', 'hourly'];
const DAY_UNITS = ['day', 'week', 'month', 'year', 'daily', 'weekly', 'monthly'];
let LOWERCASE_UNITS = [...TIME_UNITS, ...DAY_UNITS, ...WEEKDAY_UNITS];
LOWERCASE_UNITS = [...LOWERCASE_UNITS, ...LOWERCASE_UNITS.map(u => u + 's')]; // add plural forms too

// [see tests for examples]
function getNLPContainersFromReminderDateTimeText(reminderDateTimeText) {
    reminderDateTimeText = timeutils._convertOnTimetoAtTime(reminderDateTimeText);
    // 1- get {dateText:[NLPTime]}
    // 2- map dateText to NLPContainer
    // 3- merge NLPContainer with all [NLPTime]
    // 4- return NLPContainers
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


function _convertDatesTextToNLPContainers(datesText) {
    function annotateWord(word) {
        if (['a', 'in', 'on', 'the', 'of', 'every', 'this'].indexOf(word) != -1) {
            return {
                type: "PREFIX",
                word: word,
            };
        }
        if (LOWERCASE_MONTHS.indexOf(word) != -1) {
            return {
                type: "MONTH",
                word: word,
                parsedWord: new NLPDate(undefined, word),
            };
        }
        let dateRegex = new RegExp(`(on )?[0-9]([0-9])?/[0-9]([0-9])?(/[0-9][0-9][0-9][0-9]|/[0-9][0-9])?`, 'ig');
        let dateRegexMatch = word.match(dateRegex);
        if (!!dateRegexMatch) {
            let nlpDate;
            let dateString = dateRegexMatch[0].split(" ").filter(word => word.toLowerCase() != "on").join(" ");
            if (dateString.split("/").length == 3) {
                let year = dateString.split("/")[2];
                nlpDate = new NLPDate(year, null, null, dateString.split("/")[0], dateString.split("/")[1]);
            }
            else {
                nlpDate = new NLPDate(null, null, null, dateString.split("/")[0], dateString.split("/")[1]);
            }
            return {
                type: 'DATE',
                word: word,
                parsedWord: nlpDate,
            };
        }
        let ordinalRegex = new RegExp('([0-9]+)(st|nd|rd|th)', 'i');
        let ordinalRegexMatch = word.match(ordinalRegex);
        if (!!ordinalRegexMatch) {
            return {
                type: 'ORDINAL',
                word: word,
                parsedWord: ordinalRegexMatch[1],
            };
        }
        if (!isNaN(word) || word == 'next') {
            let number = word == 'next' ? 'next' : parseFloat(word);
            return {
                type: 'NUMBER_OR_NEXT',
                word: word,
                parsedWord: word == 'next' ? 'next' : number,
            };
        }
        if(LOWERCASE_UNITS.indexOf(word) != -1) {
            return {
                type: 'UNIT',
                word: word,
                parsedWord: _parseUnit(word),
            };
        }
        if (word == 'tomorrow') {
            return {
                type: 'INTERVAL',
                word: word,
                parsedWord: new NLPInterval(1, 'day'),
            };
        }
        const TIME_WORDS_MAP = {
            'morning': new NLPTime(9, undefined, 'am'),
            'noon': new NLPTime(12, undefined, 'pm'),
            'afternoon': new NLPTime(3, undefined, 'pm'),
            'evening': new NLPTime(9, undefined, 'pm'),
            'tonight': new NLPTime(9, undefined, 'pm'),
            'night': new NLPTime(9, undefined, 'pm'),
        };
        if (word in TIME_WORDS_MAP) {
            return {
                type: 'TIME',
                word: word,
                parsedWord: TIME_WORDS_MAP[word],
            };
        }
        return {
            type: "UNKNOWN",
            word: word,
        };
    }

    function mergeAnnotatedWords(annotatedWords) {
        let getAnnotatedWordWithType = (annotatedWords, type) => {
            return annotatedWords.filter(aw => aw.type == type)[0];
        };

        let getAllAnnotatedWordsWithType = (annotatedWords, type) => {
            return annotatedWords.filter(aw => aw.type == type);
        };

        // DATE done
        // UNIT -> look for NUMBER, if none then pick 1
        //      look for a stronger unit (weekdays take priority over other units)
        // MONTH -> look for NUMBER or ORDINAL
        let nlpContainer = new NLPContainer();
        let timeWord = getAnnotatedWordWithType(annotatedWords, 'TIME');
        if (!!timeWord) {
            nlpContainer.setNLPTime(timeWord.parsedWord);

        }

        let dateWord = getAnnotatedWordWithType(annotatedWords, 'DATE');
        if (!!dateWord) {
            nlpContainer.setNLPDate(dateWord.parsedWord);
            return nlpContainer;
        }

        let intervalWord = getAnnotatedWordWithType(annotatedWords, 'INTERVAL');
        if (!!intervalWord) {
            nlpContainer.setNLPInterval(intervalWord.parsedWord);
            return nlpContainer;
        }

        let monthWord = getAnnotatedWordWithType(annotatedWords, 'MONTH');
        if (!!monthWord) {
            let dayWord = getAnnotatedWordWithType(annotatedWords, 'ORDINAL') || getAnnotatedWordWithType(annotatedWords, 'NUMBER_OR_NEXT');
            nlpContainer.setNLPDate(new NLPDate(null, monthWord.word, dayWord ? dayWord.parsedWord : undefined));
            return nlpContainer;
        }

        let ordinalWord = getAnnotatedWordWithType(annotatedWords, 'ORDINAL');
        if (!!ordinalWord) {
            nlpContainer.setNLPDate(new NLPDate(null, null, ordinalWord.parsedWord));
            return nlpContainer;
        }

        let unitWords = getAllAnnotatedWordsWithType(annotatedWords, 'UNIT');
        if (!!unitWords.length) {
            let unitWord;
            if (unitWords.length == 1) {
                unitWord = unitWords[0];
            }
            else {
                // if a weekday unit exists, pick it
                unitWord = unitWords.filter(uw => WEEKDAY_UNITS.indexOf(uw.word) != -1)[0];
                // otherwise pick the first one
                if (!unitWord) {
                    unitWord = unitWords[0];
                }
            }
            let numberWord = getAnnotatedWordWithType(annotatedWords, 'NUMBER_OR_NEXT');
            nlpContainer.setNLPInterval(new NLPInterval(numberWord ? numberWord.word : undefined, unitWord.parsedWord));
            return nlpContainer;
        }

        let numberWord = getAnnotatedWordWithType(annotatedWords, 'NUMBER_OR_NEXT');
        if (!!numberWord) {
            nlpContainer.setNLPDate(new NLPDate(null, null, numberWord.parsedWord));
            return nlpContainer;
        }

        return nlpContainer;
    }
    let allNLPContainers = [];
    datesText = datesText.toLowerCase();
    let allDatesTextSplit = datesText.split(/,|and/g).filter(x => !!x.length);
    for (let dateText of allDatesTextSplit) {
        let words = dateText.split(/\s/).filter(x => !!x.length);
        let annotatedWords = words.map(w => annotateWord(w));
        allNLPContainers.push(mergeAnnotatedWords(annotatedWords));
    }
    // some NLPContainers might need to get data from neighboring NLPContainers

    // look for any month followed by an ordinal:
    // "march the 23rd and the 25th" -> [[march,23],25] -> [NLPDate(null, 3, 23), NLPDate(null, null, 25)]
    // do this step: -> [NLPDate(null, 3, 23), NLPDate(null, 3, 25)]
    // same for the other way around: "the 4th and 5th of march"
    for (let i = 0; i < allNLPContainers.length ; i++) {
        let nlpDate = allNLPContainers[i].getNLPDate();
        let previousNLPDate = (allNLPContainers[i-1] || new NLPContainer()).getNLPDate();
        let nextNLPDate = (allNLPContainers[i+1] || new NLPContainer()).getNLPDate();
        if (!nlpDate) {
            continue;
        }
        if (!nlpDate.year && !nlpDate.month && !!nlpDate.day) {
            if (!!previousNLPDate && (!!previousNLPDate.month || !!previousNLPDate.year)) {
                nlpDate.month = previousNLPDate.month;
                nlpDate.year = previousNLPDate.year;
            }
            else if (!!nextNLPDate && (!!nextNLPDate.month || !!nextNLPDate.year)) {
                nlpDate.month = nextNLPDate.month;
                nlpDate.year = nextNLPDate.year;
            }
        }
    }
    return allNLPContainers;
}

function _parseUnit(unit) {
    let map = {
        'hourly': 'hour',
        'daily': 'day',
        'weekly': 'week',
        'monthly': 'month',
    };
    if(unit in map) {
        return map[unit];
    }
    return unit;
}

module.exports = {
    getNLPContainersFromReminderDateTimeText: getNLPContainersFromReminderDateTimeText,
    // only exported for unit tests
    _convertDatesTextToNLPContainers: _convertDatesTextToNLPContainers,
};