const parseNonSingleRecurringDate = require('../../nlp/parseNonRecurringSingleDate.js'),
    timemachine = require("../../timemachine.js");

const TODAY_DATE_STRING = "June 3, 2018 12:00:00"; // string to be used in timemachine
/**
 * 06/03: Sunday, 06/04: Monday, 06/05: Tuesday,
 * 06/06: Wednesday 06/07: Thursday, 06/08: Friday,
 * 06/09: Saturday
 */

const TIMEZONE = "America/Los_Angeles";
describe("_getDateTextFromOrdinal", () => {
    timemachine.config({ dateString: TODAY_DATE_STRING });
    it('should work', () => {
        let map = {
            'on the 24th of january': 'on january 24',
            'on january the 24th': 'on january 24',
            'on march 30': 'on march 30',
            'on 30 march': 'on march 30',
            'in 20 minutes': null,
            'in 20m': null,
            'on monday': null,
            'in 1 week': null,
            'on the 30th': 'on June 30',
            'on the 2nd': 'on June 2' // TODO: fix this
        };
        
        for(let key in map) {
            expect(parseNonSingleRecurringDate._getDateTextFromOrdinal(key, TIMEZONE)).toEqual(map[key]);
        }
    });
    timemachine.reset();
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