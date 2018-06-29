const moment = require('moment'),
    remindUser = require("./botutils.js").remindUser;

function generateGUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/**
 * setTimeout cant accept time that is > 2^31 - 1, this 
 *  function uses setTimeout to keep calling itself after 2^31 - 1 milliseconds
 *  until it can call setTimeout directly on the callback
 * @param {Function} callback [description]
 * @param {[type]}   time     [description]
 */
function _setTimeout(callback, time) {
    const MAX_TIME = Math.pow(2, 31) - 1;
    if(time > MAX_TIME) {
        setTimeout(_setTimeout.bind(null, callback, time - MAX_TIME), MAX_TIME);
    }
    else {
        setTimeout(callback, time);
    }
}

module.exports = class Reminder {
    /**
     * constructor
     * @param {string}   text         text that should be sent to the user
     * @param {moment}   reminderDate date when user should be notified
     */
    constructor(text, reminderDate, userId) {
        this.text = text;
        this.reminderDate = reminderDate;
        this.dateCreated = moment.utc();
        this.id = generateGUID();
        this.userId = userId;
    }

    getUserId() {
        return this.userId;
    }

    setTimeout() {
        this.timeout = _setTimeout(() => {
            remindUser(this);
        }, this.getMilliSecondsFromNow());
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

    updateDate(date) {
        this.clearTimeout();
        this.reminderDate = date;
        this.setTimeout();
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

    getFormattedReminder(timezone, shortened) {
        let text = this.getText();
        if(text.length > 70) {
            text = shortened ? (text.slice(0, 70) + "…") : text;
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
            id: this.id,
            userId: this.userId,
        };
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
        // if same month just give week day and month day
        else if(dateNow.isSame(dateThen, 'month')) {
            return "on " + dateThen.format("dddd") + " the " + dateThen.format("Do") + " at " + time; // on Monday the 12th at 3:04 pm
        }
        // if same year just give MM/DD
        else if(dateNow.isSame(dateThen, 'year')) {
            return "on " + dateThen.format("MM/DD") + " at " + time;
        }
        // else just give the full date
        else {
            return "on " + dateThen.format("MM/DD/YYYY") + " at " + time;
        }
    }

    static deserializeReminder(serializedReminderObject) {
        let reminder = new Reminder(serializedReminderObject.text, moment(serializedReminderObject.reminderDate), serializedReminderObject.userId);
        reminder.id = serializedReminderObject.id;
        reminder.dateCreated = moment(serializedReminderObject.dateCreated);
        return reminder;
    }
};