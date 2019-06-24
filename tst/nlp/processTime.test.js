const processTime = require('../../nlp/processTime.js'),
    timemachine = require("../../timemachine.js");

const DATE_FORMAT = "MM/DD/YYYY:HH:mm";
const TIME_ZONE = "America/Los_Angeles";
const TODAY_DATE_STRING = "June 3, 2018 12:00:00"; // string to be used in timemachine
/**
 * 06/03: Sunday, 06/04: Monday, 06/05: Tuesday,
 * 06/06: Wednesday 06/07: Thursday, 06/08: Friday,
 * 06/09: Saturday
 */

describe("_splitReminderText", () => {
    it("should work", () => {
        let map = {
            'ricordami il 23 di Marzo di test': {
                reminderDateTimeText: 'il 23 di Marzo',
                reminderText: 'test',
            },
            "/ricordami ogni giorno alle 9 di mattina e alle 9 di sera di prendere le mie medicien": {
                reminderDateTimeText: 'ogni giorno alle 9 di mattina e alle 9 di sera',
                reminderText: 'prendere le mie medicien',
            },
            '/ricordami ogni giorno alle 16.00 di mandar e online l’articolo diMr.Apple': {
                reminderDateTimeText: 'ogni giorno alle 16.00',
                reminderText: 'mandar e online l’articolo diMr.Apple',
            },
            '/ricordami ogni giorno alle 16 di mandare online l’articolo di Mr.Apple': {
                reminderDateTimeText: 'ogni giorno alle 16',
                reminderText: 'mandare online l’articolo di Mr.Apple',
            },
            '/r in 20 minutes to test that hi': {
                reminderDateTimeText: 'in 20 minutes',
                reminderText: 'test that hi',
            },
        };
        for (let text in map) {
            let expectedResult = map[text];
            let result = processTime._splitReminderText(text);
            expect(result).toEqual(expectedResult);
        }
    });
});

function assertGetDate(map) {
    timemachine.config({ dateString: TODAY_DATE_STRING });
    for (let key in map) {
        let expectedResult = map[key];
        let result = processTime.getDate(key, TIME_ZONE);
        expect(result.reminderText).toEqual(expectedResult.reminderText);
        if (expectedResult.reminderDates) {

            if (expectedResult.reminderDates.formattedDates) {
                let formattedResultDates = result.reminderDates.dates.map(x => x.format(DATE_FORMAT));
                let formattedExpectedDates = expectedResult.reminderDates.formattedDates;
                expect(formattedResultDates.sort()).toEqual(formattedExpectedDates.sort());
            }
            else if (expectedResult.reminderDates.recurringDates) {
                expect(result.reminderDates.recurringDates.sort()).toEqual(expectedResult.reminderDates.recurringDates.sort());
                if (!!expectedResult.reminderDates.formattedEndingConditionDate) {
                    expect(result.reminderDates.endingConditionDate.format(DATE_FORMAT))
                        .toEqual(expectedResult.reminderDates.formattedEndingConditionDate);
                }
                else {
                    expect(undefined).toEqual(result.reminderDates.endingConditionDate);
                }
            }
            else {
                console.error("You have to specify either formattedDates or recurringDates for assertion");
                expect(false).toEqual(true);
            }
        }
    }
    timemachine.reset();
}

describe("getDate", () => {
    it('should work in english for non recurring reminders', () => {
        let map = {
            '/remindme at 2 pm to do my homework': {
                reminderText: 'do my homework',
                reminderDates: {
                    formattedDates: ["06/03/2018:14:00"],
                },
            },
            '/remindme tomorrow at 5 pm to do my homework': {
                reminderText: 'do my homework',
                reminderDates: {
                    formattedDates: ["06/04/2018:17:00"],
                },
            },
            '/remindme on wednesday at 3 pm and on saturday at 10 am to wake up': {
                reminderText: 'wake up',
                reminderDates: {
                    formattedDates: ["06/09/2018:10:00", "06/06/2018:15:00"],
                },
            },
            '/remindme in five minutes to check on the oven': {
                reminderText: 'check on the oven',
                reminderDates: {
                    formattedDates: ["06/03/2018:12:05"],
                },
            },
            '/remindme on wednesday to pickup the kids from school': {
                reminderText: 'pickup the kids from school',
                reminderDates: {
                    formattedDates: ["06/06/2018:12:00"],
                },
            },
            '/remindme on january 5th that today is my birthday!': {
                reminderText: 'today is my birthday!',
                reminderDates: {
                    formattedDates: ["01/05/2019:12:00"],
                },
            },
            '/remindme on 23rd of march to ...': {
                reminderText: '...',
                reminderDates: {
                    formattedDates: ["03/23/2019:12:00"],
                },
            },
            '/remindme on the 1st to ...': {
                reminderText: '...',
                reminderDates: {
                    formattedDates: ["06/01/2019:12:00"],
                },
            },
        };
        assertGetDate(map);
    });
    it('should work in english for recurring reminders', () => {
        let map = {
            '/remindme every weekday at 12 pm to call my son in school to check on him': {
                reminderText: 'call my son in school to check on him',
                reminderDates: {
                    recurringDates: ["on monday at 12:00 pm", "on tuesday at 12:00 pm", "on wednesday at 12:00 pm", "on thursday at 12:00 pm", "on friday at 12:00 pm"],
                },
            },
            '/remindme every hour until 6 pm to log my work': {
                reminderText: 'log my work',
                reminderDates: {
                    recurringDates: ["in 1 hours"],
                    formattedEndingConditionDate: "06/03/2018:18:00",
                },
            },
            '/remindme every hour until 604 to log my work': {
                reminderText: 'log my work',
                reminderDates: {
                    recurringDates: ["in 1 hours"],
                    formattedEndingConditionDate: "06/03/2018:18:04",
                },
            },
            '/remindme every tuesday, wednesday at 3 and 4 pm and every saturday at 9 am to take my vitamins': {
                reminderText: 'take my vitamins',
                reminderDates: {
                    recurringDates: ["on tuesday at 3 pm", "on tuesday at 4 pm", "on wednesday at 3 pm", "on wednesday at 4 pm", "on saturday at 9 am"],
                }
            },
            'fakarny kol youm etnen warba3 at 5 pm w kol youm talat at 7,8 am to test': {
                reminderText: 'test',
                reminderDates: {
                    recurringDates: ["on monday at 5 pm", "on wednesday at 5 pm", "on tuesday at 7 am", "on tuesday at 8 am"],
                },
            },
            '/remindme every weekday at 9 am and every weekend at 11 am to open up the store': {
                reminderText: 'open up the store',
                reminderDates: {
                    recurringDates: ["on monday at 9 am", "on tuesday at 9 am", "on wednesday at 9 am",
                        "on thursday at 9 am", "on friday at 9 am", "on saturday at 11:00 am", "on sunday at 11:00 am"
                    ],
                }
            },
            '/remindme every monday and every tuesday to test': {
                reminderText: 'test',
                reminderDates: {
                    recurringDates: ['on monday', 'on tuesday'],
                }
            },
            '/remindme every minute and every hour to test': {
                reminderText: 'test',
                reminderDates: {
                    recurringDates: ['in 1 minute', 'in 1 hours'],
                }
            },
        };
        assertGetDate(map);
    });
    it('should work in italian for non recurring reminders', () => {
        let map = {
            "ricordami tra 10 minuti di controllare il forno": {
                reminderText: 'controllare il forno',
                reminderDates: {
                    formattedDates: ["06/03/2018:12:10"],
                }
            },
            "ricordami tra 1 ora che sto ancora lavorando": {
                reminderText: 'sto ancora lavorando',
                reminderDates: {
                    formattedDates: ["06/03/2018:13:00"],
                }
            },
            "ricordami tra tre minuti di test": {
                reminderText: 'test',
                reminderDates: {
                    formattedDates: ["06/03/2018:12:03"],
                }
            },
            "ricordami alle 10 di test": {
                reminderText: 'test',
                reminderDates: {
                    formattedDates: ["06/03/2018:22:00"],
                }
            },
            "ricordami il 23 di Marzo di test": {
                reminderText: 'test',
                reminderDates: {
                    formattedDates: ["03/23/2019:12:00"],
                }
            },
            "/ricordami alle 2 di pomeriggio di fare i compiti": {
                reminderText: 'fare i compiti',
                reminderDates: {
                    formattedDates: ["06/03/2018:14:00"],
                }
            },
            "/ricordami domani alle 5 di pomeriggio di fare i compiti": {
                reminderText: 'fare i compiti',
                reminderDates: {
                    formattedDates: ["06/04/2018:17:00"],
                }
            },
            "/r tra 5 minuti di controllare il forno": {
                reminderText: 'controllare il forno',
                reminderDates: {
                    formattedDates: ["06/03/2018:12:05"],
                }
            },
            "/ricordami mercoledì di prendere i bambini da scuola": {
                reminderText: 'prendere i bambini da scuola',
                reminderDates: {
                    formattedDates: ["06/06/2018:12:00"],
                }
            },
            "ricordami il 5 Gennaio che oggi è il mio compleanno": {
                reminderText: 'oggi è il mio compleanno',
                reminderDates: {
                    formattedDates: ["01/05/2019:12:00"],
                }
            },
        };
        assertGetDate(map);
    });

    it('should work in italian for recurring reminders', () => {
        let map = {
            "ricordami ogni giorno della settimana alle 12 di pomeriggio di chiamare mio figlio  ": {
                reminderText: 'chiamare mio figlio',
                reminderDates: {
                    recurringDates: ["on monday at 12:00 pm", "on tuesday at 12:00 pm", "on wednesday at 12:00 pm", "on thursday at 12:00 pm", "on friday at 12:00 pm"],
                }
            },
            "ricordami ogni ora sino alle 6 di pomeriggio di registrare il mio lavoro ": {
                reminderText: 'registrare il mio lavoro',
                reminderDates: {
                    recurringDates: ["in 1 hours"],
                    formattedEndingConditionDate: "06/03/2018:18:00",
                }
            },
            "/ricordami ogni giorno alle 9 di mattina e alle 9 di sera di prendere le mie medicien": {
                reminderText: 'prendere le mie medicien',
                reminderDates: {
                    recurringDates: ["in 1 days at 9 am", "in 1 days at 9 pm"],
                }
            },
            "/ricordami ogni domenica  alle 10 di mattina di lavare i panni": {
                reminderText: 'lavare i panni',
                reminderDates: {
                    recurringDates: ["on sunday at 10:00 am"],
                }
            },
            "/ricordami ogni lunedì, mercoledì e venerdi alle 5 di pomeriggio di andare via dal lavoro per prendere i bambini": {
                reminderText: 'andare via dal lavoro per prendere i bambini',
                reminderDates: {
                    recurringDates: ["on monday at 5 pm", "on wednesday at 5 pm", "on friday at 5 pm"],
                }
            },
            "/ricordami ogni 2 ore di controllare la mia mail": {
                reminderText: 'controllare la mia mail',
                reminderDates: {
                    recurringDates: ["in 2 hours"],
                }
            },
            "ricordami ogni giorno i giorni di test": {
                reminderText: 'test',
                reminderDates: {
                    recurringDates: ["in 1 days"],
                }
            },
        };
        assertGetDate(map);
    });
});