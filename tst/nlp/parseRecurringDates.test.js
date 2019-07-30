const parseRecurringDates = require('../../nlp/parseRecurringDates.js'),
    processTime = require('../../nlp/processTime.js');

// TODO: more tests
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
        };
        for (let key in map) {
            let result = parseRecurringDates.parseRecurringDates(key);
            expect(result).toEqual(map[key]);
        }
    });

    it('should work with italian too (after preProcessing)', () => {
        let map = {
            'ogni giorno della settimana alle 12 di pomeriggio': {
                recurringDates: ['in 1 monday at 12:00 pm', 'in 1 tuesday at 12:00 pm', 'in 1 wednesday at 12:00 pm', 'in 1 thursday at 12:00 pm', 'in 1 friday at 12:00 pm'],
                endingConditionDate: undefined
            },
            'ogni ora sino alle 6 di pomeriggio': {
                recurringDates: ['in 1 hours'],
                endingConditionDate: ['at 6 pm'],
            },
            'ogni giorno alle 9 di mattina e alle 9 di sera': {
                recurringDates: ['in 1 days at 9 am', 'in 1 days at 9 pm'],
                endingConditionDate: undefined,
            },
            'ogni domenica  alle 10 di mattina': {
                recurringDates: ['in 1 sunday at 10:00 am'],
                endingConditionDate: undefined,
            },
            'ogni lunedì, mercoledì e venerdi alle 5 di pomeriggio': {
                recurringDates: ['in 1 monday at 5 pm', 'in 1 wednesday at 5 pm', 'in 1 friday at 5 pm'],
                endingConditionDate: undefined,
            },
            'ogni 2 ore': {
                recurringDates: ['in 2 hours'],
                endingConditionDate: undefined,
            },
        };
        for (let reminderDateTimeText in map) {
            let preProcessedReminderDateTimeText = processTime.preProcessReminderDateTimeText(reminderDateTimeText);
            let result = parseRecurringDates.parseRecurringDates(preProcessedReminderDateTimeText);
            expect(result.recurringDates).toEqual(map[reminderDateTimeText].recurringDates);
        }
    });
});
