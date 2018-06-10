const processTime = require('../processTime.js'),
    timemachine = require('timemachine');

const TIME_ZONE = "America/Los_Angeles";

const DATE_TIMES = {
    TOMORROW_AT_2_PM: "tomorrow at 2 pm",
    TWO_PM: "2 pm",
    IN_2_DAYS: 'in 2 days',
    IN_2_DAYS_AT_2_PM: 'in 2 days at 2 pm',
    IN_2_MINUTES: 'in 2 minutes',
};

const REMINDER_TEXT = "eat food";

function getCompleteUtterance(dateTime, reminderText=REMINDER_TEXT) {
    return `/remindme ${dateTime} to ${reminderText}`;
}

describe('getDate', () => {
    afterEach(() => {
        timemachine.reset();
    });

    it(`'${DATE_TIMES.TOMORROW_AT_2_PM}' should get the next day at 2pm whether we are before or after 2 pm`, () => {
        // before 2 pm
        timemachine.config({dateString: 'June 1, 2018 12:00:00'}); // friday
        let result = processTime.getDate(getCompleteUtterance(DATE_TIMES.TOMORROW_AT_2_PM), TIME_ZONE);
        expect(result.format("MM/DD/YYYY:HH:mm")).toEqual("06/02/2018:14:00");

        // after 2 pm
        timemachine.config({dateString: 'June 1, 2018 15:00:00'}); // friday
        result = processTime.getDate(getCompleteUtterance(DATE_TIMES.TOMORROW_AT_2_PM), TIME_ZONE);
        expect(result.format("MM/DD/YYYY")).toEqual("06/02/2018");
    });

    it(`${DATE_TIMES.TWO_PM}' should get today's 2 pm when we are before 2 pm today`, () => {
        timemachine.config({dateString: 'June 1, 2018 10:00:00'}); // friday
        let result = processTime.getDate(getCompleteUtterance(DATE_TIMES.TWO_PM), TIME_ZONE);
        expect(result.format("MM/DD/YYYY:HH:mm")).toEqual("06/01/2018:14:00");
    });

    it(`${DATE_TIMES.TWO_PM}' should get tomorrow's 2pm when we are after 2 pm today`, () => {
        timemachine.config({dateString: 'June 1, 2018 15:00:00'}); // friday
        let result = processTime.getDate(getCompleteUtterance(DATE_TIMES.TWO_PM), TIME_ZONE);
        expect(result.format("MM/DD/YYYY:HH:mm")).toEqual("06/02/2018:14:00");
    });

    it(`${DATE_TIMES.IN_2_MINUTES} should get time after 2 minutes`, () => {
        timemachine.config({dateString: 'June 1, 2018 15:05:00'}); // friday
        let result = processTime.getDate(getCompleteUtterance(DATE_TIMES.IN_2_MINUTES), TIME_ZONE);
        expect(result.format("MM/DD/YYYY:HH:mm")).toEqual("06/01/2018:15:07");
    });

});

describe('_splitReminderText', () => {
    it('should work with "to"morrow', () => {
        let text = getCompleteUtterance(DATE_TIMES.TOMORROW_AT_2_PM, REMINDER_TEXT);
        let result = processTime._splitReminderText(text);
        expect(result.reminderText).toEqual(REMINDER_TEXT); // remove the "to"
        expect(result.reminderDateTime).toEqual(DATE_TIMES.TOMORROW_AT_2_PM);
    });
});