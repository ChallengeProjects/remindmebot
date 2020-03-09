const parseRecurringDates = require('../../nlp/parseRecurringDates.js'),
    { NLPContainer, NLPTime, NLPInterval } = require("../../nlp/models/date.js");

describe("_convertRecurringDate", () => {
    it('should work', () => {
        let keys = [
            new NLPContainer(new NLPInterval(30, 'minutes'), new NLPTime(3, null, 'am')), // 1
            new NLPContainer(new NLPInterval(2, 'days'), null), // 2
            new NLPContainer(new NLPInterval(3, 'hours'), new NLPTime(3, 40)), // 3
            new NLPContainer(new NLPInterval(4, 'mondays'), new NLPTime(16, 41)), // 4
            new NLPContainer(new NLPInterval(undefined, 'monday'), null), // 5
        ];
        let values = [
            'in 30 minute at 3 am', // 1
            'in 2 day', // 2
            'in 3 hour at 3:40', // 3
            'in 4 monday at 16:41', // 4
            'in 1 monday', // 5
        ];
        for (let i in keys) {
            expect(parseRecurringDates._convertRecurringDate(keys[i])).toEqual(values[i]);
        }
    });
});

describe("parseRecurringDates", () => {
    it('should work', () => {
        let map = {
            'every 2 days': {
                recurringDates: ['in 2 day'],
                endingConditionDate: undefined
            },
            'every monday at 2 am and tuesday at 3 pm and every 2 days at 9 am': {
                recurringDates: ['in 1 monday at 2 am', 'in 1 tuesday at 3 pm', 'in 2 day at 9 am'],
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
                recurringDates: ['in 3 monday', 'in 2 tuesday'],
                endingConditionDate: undefined,
            },
            "every 3 hours": {
                recurringDates: ['in 3 hour'],
                endingConditionDate: undefined,
            },
            "every hour": {
                recurringDates: ['in 1 hour'],
                endingConditionDate: undefined,
            },
            "every 1st of month": {
                recurringDates: ['on the 1st'],
                endingConditionDate: undefined,
            },
            "every morning": {
                recurringDates: ['at 9 am'],
                endingConditionDate: undefined,
            }
        };
        for (let key in map) {
            let result = parseRecurringDates.parseRecurringDates(key);
            expect(result).toEqual(map[key]);
        }
    });
});
