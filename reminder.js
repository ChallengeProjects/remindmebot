const moment = require('moment');

function generateGUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

module.exports = class Reminder {
    /**
     * constructor
     * @param {string}   text         text that should be sent to the user
     * @param {moment}   reminderDate date when user should be notified
     */
    constructor(text, reminderDate) {
        this.text = text;
        this.reminderDate = reminderDate;
        this.dateCreated = moment.utc();
        this.id = generateGUID();
    }

    setTimeout(callback) {
        this.timeout = setTimeout(callback, this.getMilliSecondsFromNow());
    }

    clearTimeout() {
        if(this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    getMilliSecondsFromNow() {
        return (this.getDate().unix() - moment().unix()) * 1000;
    }

    isInThePast() {
        return this.getMilliSecondsFromNow() < 0;
    }

    updateText(text) {
        this.text = text;
    }

    updateDate(date, callback) {
        this.clearTimeout();
        this.reminderDate = date;
        this.setTimeout(callback);
    }

    getText() {
        return this.text;
    }

    getDateCrated() {
        return this.dateCreated;
    }

    getDate() {
        return this.reminderDate;
    }

    getDateFormatted(timezone) {
        let dateNow = moment.tz(timezone);
        let dateThen = moment.tz(this.reminderDate, timezone);
        // if minute is 0 then just give the hour
        let time;

        if(dateThen.format("mm") == "00") {
            time = dateThen.format("h a");
        }
        else {
            time = dateThen.format("h:mm a");
        }

        // if same day just give time
        if(dateNow.isSame(dateThen, 'day')) {
            return "at " + time;
        }
        else if(dateNow.isSame(dateThen, 'month')) {
            return "on the " + dateThen.format("Do") + " at " + time;
        }
        else if(dateNow.isSame(dateThen, 'year')) {
            return "on " + dateThen.format("MM/DD") + " at " + time;
        }
        else {
            return "on " + dateThen.format("MM/DD/YYYY") + " at " + time;
        }
    }

    getFormattedReminder(timezone) {
        let text = this.getText();
        if(text.length > 70) {
            text = text.slice(0, 70) + "…";
        }
        return `<b>${this.getDateFormatted(timezone)}:</b>\n${text}`;
    }

    getId() {
        return this.id;
    }

    getSnoozedReminder(snoozePeriodInMilliSeconds) {
        return new Reminder(this.text, moment(moment().valueOf() + snoozePeriodInMilliSeconds));
    }

    getSerializableObject() {
        return {
            text: this.text,
            dateCreated: this.dateCreated.valueOf(),
            reminderDate: this.reminderDate.valueOf(),
            id: this.id
        };
    }

    static deserializeReminder(serializedReminderObject) {
        let reminder = new Reminder(serializedReminderObject.text, moment(serializedReminderObject.reminderDate));
        reminder.id = serializedReminderObject.id;
        reminder.dateCreated = moment(serializedReminderObject.dateCreated);
        return reminder;
    }
};