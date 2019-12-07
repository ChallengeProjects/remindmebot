const parseNonSingleRecurringDate = require('../../nlp/parseNonRecurringSingleDate.js'),
    timemachine = require("../../timemachine.js"),
    moment = require('moment-timezone');

const TODAY_DATE_STRING = "June 3, 2018 12:00:00"; // string to be used in timemachine
const TODAY_DATE_STRING_4AM = "June 3, 2018 4:00:00"; // string to be used in timemachine
/**
 * 06/03: Sunday, 06/04: Monday, 06/05: Tuesday,
 * 06/06: Wednesday 06/07: Thursday, 06/08: Friday,
 * 06/09: Saturday
 * ---
 * 06/10: Sunday, 06/11: Monday
 */

const TIMEZONE = "America/Los_Angeles";

describe("_addInToUnits", () => {
    it("should work", () => {
        let map = {
            "5 minutes": "in 5 minutes",
            "2 saturdays": "in 2 saturdays",
            // dont change
            "on 02/03": "on 02/03",
            "in 5 minutes": "in 5 minutes",
            "at 4 pm": "at 4 pm",
            "on saturday": "on saturday",
            "saturday": "saturday",
        };
        for(let key in map) {
            expect(parseNonSingleRecurringDate._addInToUnits(key, TIMEZONE)).toEqual(map[key]);
        }
    });
});

describe("_parseCustomDateFormats", () => {
    it("should work", () => {
        timemachine.config({ dateString: TODAY_DATE_STRING });
        let map = {
            "in 2 saturdays": "on 06/16 at 12 pm",
            "on the 5th at 4pm": "on 06/05 at 4 pm",
            "on the 4th of march": "on 03/04 at 12 pm",
            "in 5 days at 2 pm": "in 5 days at 2 pm",
            "on 02/03": "on 02/03",
        };
        for(let key in map) {
            expect(parseNonSingleRecurringDate._parseCustomDateFormats(key, TIMEZONE)).toEqual(map[key]);
        }
        timemachine.reset();
    });
});

describe("_getDateTextFromOrdinal", () => {
    it('should work', () => {
        timemachine.config({ dateString: TODAY_DATE_STRING });
        let map = {
            'on the 24th of january': '01/24',
            'on january the 24th': '01/24',
            'on march 30': '03/30',
            'on 30 march': '03/30',
            'in 20 minutes': null,
            'in 20m': null,
            'on monday': null,
            'in 2 mondays': null,
            'in 1 week': null,
            'on the 30th': '06/30',
            'on the 2nd': '07/02',
            'on 02/03': null,
        };
        for(let key in map) {
            expect(parseNonSingleRecurringDate._getDateTextFromOrdinal(key, TIMEZONE)).toEqual(map[key]);
        }
        timemachine.reset();
    });
});

describe("_parseInNWeekdays", () => {
    it('should work', () => {
        timemachine.config({ dateString: TODAY_DATE_STRING });
        let map = {
            'on the 24th of january': null,
            'on january the 24th': null,
            'on march 30': null,
            'on 30 march': null,
            'in 20 minutes': null,
            'in 20m': null,
            'on monday': null,
            'in 2 mondays': '06/11',
            'in 1 tuesdays': '06/05',
            'in 4 Wednesdays': '06/27',
            'in 1 week': null,
            'on the 30th': null,
            'on the 2nd': null
        };
        for(let key in map) {
            expect(parseNonSingleRecurringDate._parseInNWeekdays(key, TIMEZONE)).toEqual(map[key]);
        }
        timemachine.reset();
    });
});

describe("_convertOnTimetoAtTime", () => {
    it("should work", () => {
        let map = {
            'on 3': 'at 3:00',
            'on 3:04': 'at 3:04',
            'on 3 pm': 'at 3:00 pm',
            'on 14': 'at 14:00',
            // shouldnt change
            'on the 2nd': 'on the 2nd',
            'on monday': 'on monday',
            'at 2': 'at 2',
            'next week': 'next week',
        };
        for(let key in map) {
            expect(parseNonSingleRecurringDate._convertOnTimetoAtTime(key)).toEqual(map[key]);
        }
    });
});

describe("_isMeridiemImplied", () => {
    it("should work", () => {
        let map = {
            "at 2": true,
            "at 3:04": true,
            "at 12:03": true,
            "at 5 am": false,
            "at 6:05 p.m": false,
            "at 4:02 PM": false,
        };
        for(let key in map) {
            expect(parseNonSingleRecurringDate._isMeridiemImplied(key)).toEqual(map[key]);
        }
    });
});

describe("_fixImpliedMeridiemOfChronoResult", () => {
    it("should create date with correct meridiem given the current time is in pm", () => {
        timemachine.config({ dateString: TODAY_DATE_STRING });
        let currentDate = moment();
        let map = {
            "at 2": moment("2018-06-03T14:00:00"),
            "at 3:04": moment("2018-06-03T15:04:00"),
            "at 12:03": moment("2018-06-03T12:03:00"),
        };
        for(let key in map) {
            let fixedDate = parseNonSingleRecurringDate._fixImpliedMeridiemOfChronoResult(currentDate, TIMEZONE, key).d;
            expect(fixedDate.isSame(map[key])).toBe(true);
        }
        timemachine.reset();
    });
    it("should create date with correct meridiem given the current time is in am", () => {
        timemachine.config({ dateString: TODAY_DATE_STRING_4AM });
        let currentDate = moment();
        let map = {
            "at 2": moment("2018-06-03T14:00:00"),
            "at 3:04": moment("2018-06-03T15:04:00"),
            "at 5:03": moment("2018-06-03T05:03:00"),
            "at 11:03": moment("2018-06-03T11:03:00"),
        };
        for(let key in map) {
            let fixedDate = parseNonSingleRecurringDate._fixImpliedMeridiemOfChronoResult(currentDate, TIMEZONE, key).d;
            expect(fixedDate.isSame(map[key])).toBe(true);
        }
        timemachine.reset();
    });
});

describe("parseNonRecurringSingleDate", () => {
    it("should work", () => {
        timemachine.config({ dateString: TODAY_DATE_STRING_4AM });
        let map = {
            "at 2": moment("2018-06-03T14:00:00"),
            "at 3:04": moment("2018-06-03T15:04:00"),
            "at 5:03": moment("2018-06-03T05:03:00"),
            "at 11:03": moment("2018-06-03T11:03:00"),
        };
        for(let key in map) {
            let parsedDate = parseNonSingleRecurringDate.parseNonRecurringSingleDate(key, TIMEZONE);
            expect(parsedDate.isSame(map[key])).toBe(true);
        }
        timemachine.reset();
    });
});

describe("_fixDatesInThePast", () => {
    it("should return the date as is if its not in the past and weekday isn't specified", () => {
        let placeholder_int = 1;

        let currentDate = moment("2018-06-03T12:00:00");
        let dateToBeFixed = moment("2018-06-03T13:00:00");
        let chronoResult = {
            start: {
                knownValues: {
                    day: placeholder_int,
                    hour: placeholder_int,
                },
                impliedValues: {
                },
            },
        };

        let fixedDate = parseNonSingleRecurringDate._fixDatesInThePast(dateToBeFixed, currentDate, chronoResult);
        expect(fixedDate.isSame(moment("2018-06-03T13:00:00"))).toBe(true);
    });

    it("should add a week if the input date is in the past and we've specified a weekday", () => {
        let placeholder_int = 1;

        let currentDate = moment("2018-06-03T12:00:00");
        let dateToBeFixed = moment("2018-06-03T12:00:00");
        let chronoResult = {
            start: {
                knownValues: {
                    weekday: placeholder_int,
                },
                impliedValues: {
                    day: placeholder_int,
                },
            },
        };

        let fixedDate = parseNonSingleRecurringDate._fixDatesInThePast(dateToBeFixed, currentDate, chronoResult);
        expect(fixedDate.isSame(moment("2018-06-10T12:00:00"))).toBe(true);
    });

    it("should add a year if the input date is in the past and we've only specified the day", () => {
        let placeholder_int = 1;

        let currentDate = moment("2018-06-03T12:00:00");
        let dateToBeFixed = moment("2018-06-01T12:00:00");
        let chronoResult = {
            start: {
                knownValues: {
                    day: placeholder_int,
                },
                impliedValues: {
                    year: placeholder_int,
                },
            },
        };

        let fixedDate = parseNonSingleRecurringDate._fixDatesInThePast(dateToBeFixed, currentDate, chronoResult);
        expect(fixedDate.isSame(moment("2019-06-01T12:00:00"))).toBe(true);
    });

    it("should return the next day if the input date is in the past but the day, month, and year are not specified", () => {
        let placeholder_int = 1;

        let currentDate = moment("2018-06-03T12:00:00");
        let dateToBeFixed = moment("2018-06-03T08:00:00");
        let chronoResult = {
            start: {
                knownValues: {
                },
                impliedValues: {
                    day: placeholder_int,
                },
            },
        };

        let fixedDate = parseNonSingleRecurringDate._fixDatesInThePast(dateToBeFixed, currentDate, chronoResult);
        expect(fixedDate.isSame(moment("2018-06-04T08:00:00"))).toBe(true);
    });
});
