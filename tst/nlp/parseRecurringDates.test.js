const parseRecurringDates = require('../../nlp/parseRecurringDates.js');

describe("_getRecurringDates", () => {
    it('should work', () => {
        let map = {
            'every 2 days': ['in 2 days'],
        };
        for (let key in map) {
            expect(parseRecurringDates._getRecurringDates(key)).toEqual(map[key]);
        }
    });
});

describe("parseRecurringDates", () => {
    it('should work', () => {
        let map = {
            'every 2 days': {
                recurringDates: ['in 2 days'],
                endingConditionDate: undefined
            },
            'every monday at 2 am and tuesday at 3 pm and every 2 days at 9 am': {
                recurringDates: ['on monday at 2 am', 'on tuesday at 3 pm', 'in 2 days at 9 am'],
                endingConditionDate: undefined,
            },
        };
        for (let key in map) {
            expect(parseRecurringDates.parseRecurringDates(key)).toEqual(map[key]);
        }
    });
});