const parseNonSingleRecurringDate = require('../../nlp/parseNonRecurringSingleDate.js'),
    timemachine = require("../../timemachine.js");

const TODAY_DATE_STRING = "June 3, 2018 12:00:00"; // string to be used in timemachine
/**
 * 06/03: Sunday, 06/04: Monday, 06/05: Tuesday,
 * 06/06: Wednesday 06/07: Thursday, 06/08: Friday,
 * 06/09: Saturday
 * ---
 * 06/10: Sunday, 06/11: Monday
 */

const TIMEZONE = "America/Los_Angeles";

describe("_parseCustomDateFormats", () => {
    it("should work", () => {
        timemachine.config({ dateString: TODAY_DATE_STRING });
        let map = {
            "in 2 saturdays": "on 06/16 at 12 pm",
            "on the 5th at 4pm": "on 06/05 at 4 pm",
            "on the 4th of march": "on 03/04 at 12 pm",
            "in 5 days at 2 pm": "in 5 days at 2 pm",
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
            'on the 2nd': '07/02'
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