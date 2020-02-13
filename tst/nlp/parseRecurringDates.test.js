const parseRecurringDates = require('../../nlp/parseRecurringDates.js');

// TODO: more tests
describe("_getRecurringDates", () => {
    it('should work', () => {
        let map = {
            'every 30 minutes some text to ignore': ['in 30 minutes'],
            'every 2 days': ['in 2 days'],
            'every 3 hours': ['in 3 hours'],
            'every 3 hours, 3 minutes': ['in 3 hours', 'in 3 minutes'],
            'every 3 mondays, 2 tuesdays': ['in 3 mondays', 'in 2 tuesdays'],
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
                recurringDates: ['in 1 monday at 2 am', 'in 1 tuesday at 3 pm', 'in 2 days at 9 am'],
                endingConditionDate: undefined,
            },
            'every monday, tuesday at 6,7 pm': {
                recurringDates: ['in 1 monday at 6 pm', 'in 1 monday at 7 pm', 'in 1 tuesday at 6 pm', 'in 1 tuesday at 7 pm'],
                endingConditionDate: undefined,
            },
            'every monday,tuesday at 6,7 pm': {
                recurringDates: ['in 1 monday at 6 pm', 'in 1 monday at 7 pm', 'in 1 tuesday at 6 pm', 'in 1 tuesday at 7 pm'],
                endingConditionDate: undefined,
            },
            'every thursday and friday at 6,7 pm': {
                recurringDates: ['in 1 thursday at 6 pm', 'in 1 thursday at 7 pm', 'in 1 friday at 6 pm', 'in 1 friday at 7 pm'],
                endingConditionDate: undefined,
            },
            '/remindme every minute and every hour to test': {
                recurringDates: ['in 1 minute', 'in 1 hour'],
                endingConditionDate: undefined,
            },
            '/remindme every 3 mondays, 2 tuesdays': {
                recurringDates: ['in 3 mondays', 'in 2 tuesdays'],
                endingConditionDate: undefined,
            },
        };
        for (let key in map) {
            let result = parseRecurringDates.parseRecurringDates(key);
            expect(result).toEqual(map[key]);
        }
    });
});
