const processTime = require('../../nlp/processTime.js');
// TODO: actually check the result and not just the length
describe("getDate", () => {
    it('should work', () => {
        map = {
            '/remindme at 2 pm to do my homework': {
                reminderText: 'do my homework',
                reminderDates: {
                    datesLength: 1,
                },
            },
            '/remindme tomorrow at 5 pm to do my homework': {
                reminderText: 'do my homework',
                reminderDates: {
                    datesLength: 1,
                },
            },
            '/remindme on wednesday at 3 pm and on saturday at 10 am to wake up': {
                reminderText: 'wake up',
                reminderDates: {
                    datesLength: 2,
                },
            },
            '/remindme in five minutes to check on the oven': {
                reminderText: 'check on the oven',
                reminderDates: {
                    datesLength: 1,
                },
            },
            '/remindme on wednesday to pickup the kids from school': {
                reminderText: 'pickup the kids from school',
                reminderDates: {
                    datesLength: 1,
                },
            },
            '/remindme on january 5th that today is my birthday!': {
                reminderText: 'today is my birthday!',
                reminderDates: {
                    datesLength: 1,
                },
            },
            '/remindme every weekday at 12 pm to call my son in school to check on him': {
                reminderText: 'call my son in school to check on him',
                reminderDates: {
                    recurringDatesLength: 5,
                    hasEndingConditionDate: false,
                },
            },
            '/remindme every hour until 6 pm to log my work': {
                reminderText: 'log my work',
                reminderDates: {
                    recurringDatesLength: 1,
                    hasEndingConditionDate: true,
                },
            },
            '/remindme every tuesday, wednesday at 3 and 4 pm and every saturday at 9 am to take my vitamins': {
                reminderText: 'take my vitamins',
                reminderDates: {
                    recurringDatesLength: 5,
                    hasEndingConditionDate: false,
                }
            },
            '/remindme every weekday at 9 am and every weekend at 11 am to open up the store': {
                reminderText: 'open up the store',
                reminderDates: {
                    recurringDatesLength: 7,
                    hasEndingConditionDate: false,
                }
            },
        };
        for(let key in map) {
            let value = map[key];
            let result = processTime.getDate(key);
            expect(result.reminderText).toEqual(value.reminderText);
            if(value.reminderDates) {
                if(value.reminderDates.datesLength) {
                    expect(result.reminderDates.dates.length).toEqual(value.reminderDates.datesLength);
                }
                if(value.reminderDates.recurringDatesLength) {
                    expect(result.reminderDates.recurringDates.length).toEqual(value.reminderDates.recurringDatesLength)
                }
                if(value.reminderDates.hasEndingConditionDate !== undefined) {
                    expect(!!result.reminderDates.endingConditionDate).toEqual(value.reminderDates.hasEndingConditionDate)
                }
            }
        }
    });
});
// const TIME_ZONE = "America/Los_Angeles";

// const DATE_TIMES = {
//     TOMORROW_AT_2_PM: "tomorrow at 2 pm",
//     TWO_PM: "2 pm",
//     IN_2_DAYS: 'in 2 days',
//     IN_2_DAYS_AT_2_PM: 'in 2 days at 2 pm',
//     IN_2_MINUTES: 'in 2 minutes',
// };

// const REMINDER_TEXT = "eat food";

// function getCompleteUtterance(dateTime, reminderText = REMINDER_TEXT) {
//     return `/remindme ${dateTime} to ${reminderText}`;
// }

// describe('getDate', () => {
//     afterEach(() => {
//         timemachine.reset();
//     });

//     it(`'${DATE_TIMES.TOMORROW_AT_2_PM}' should get the next day at 2pm whether we are before or after 2 pm`, () => {
//         // before 2 pm
//         timemachine.config({ dateString: 'June 1, 2018 12:00:00' }); // friday
//         let result = processTime.getDate(getCompleteUtterance(DATE_TIMES.TOMORROW_AT_2_PM), TIME_ZONE);
//         expect(result.format("MM/DD/YYYY:HH:mm")).toEqual("06/02/2018:14:00");

//         // after 2 pm
//         timemachine.config({ dateString: 'June 1, 2018 15:00:00' }); // friday
//         result = processTime.getDate(getCompleteUtterance(DATE_TIMES.TOMORROW_AT_2_PM), TIME_ZONE);
//         expect(result.format("MM/DD/YYYY")).toEqual("06/02/2018");
//     });

//     it(`${DATE_TIMES.TWO_PM}' should get today's 2 pm when we are before 2 pm today`, () => {
//         timemachine.config({ dateString: 'June 1, 2018 10:00:00' }); // friday
//         let result = processTime.getDate(getCompleteUtterance(DATE_TIMES.TWO_PM), TIME_ZONE);
//         expect(result.format("MM/DD/YYYY:HH:mm")).toEqual("06/01/2018:14:00");
//     });

//     it(`${DATE_TIMES.TWO_PM}' should get tomorrow's 2pm when we are after 2 pm today`, () => {
//         timemachine.config({ dateString: 'June 1, 2018 15:00:00' }); // friday
//         let result = processTime.getDate(getCompleteUtterance(DATE_TIMES.TWO_PM), TIME_ZONE);
//         expect(result.format("MM/DD/YYYY:HH:mm")).toEqual("06/02/2018:14:00");
//     });

//     it(`${DATE_TIMES.IN_2_MINUTES} should get time after 2 minutes`, () => {
//         timemachine.config({ dateString: 'June 1, 2018 15:05:00' }); // friday
//         let result = processTime.getDate(getCompleteUtterance(DATE_TIMES.IN_2_MINUTES), TIME_ZONE);
//         expect(result.format("MM/DD/YYYY:HH:mm")).toEqual("06/01/2018:15:07");
//     });

// });

// describe('_splitReminderText', () => {
//     it('should work with "to"morrow', () => {
//         let text = getCompleteUtterance(DATE_TIMES.TOMORROW_AT_2_PM, REMINDER_TEXT);
//         let result = processTime._splitReminderText(text);
//         expect(result.reminderText).toEqual(REMINDER_TEXT); // remove the "to"
//         expect(result.reminderDateTime).toEqual(DATE_TIMES.TOMORROW_AT_2_PM);
//     });
// });