const moment = require('moment'),
    remindUser = require("./botutils.js").remindUser,
    ReminderDate = require("./reminderDate.js");

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
     * @param {string}       text          text that should be sent to the user
     * @param {ReminderDate} reminderDate  reminderDate date when user should be notified
     */
    constructor(text, reminderDate, userId) {
        this.text = text;
        this.reminderDate = reminderDate;
        this.dateCreated = moment.utc();
        this.id = generateGUID();
        this.userId = userId;
        this.enabled = true;
    }

    getUserId() {
        return this.userId;
    }


    /**
     * setTimeout cant accept time that is > 2^31 - 1, this 
     *  function uses setTimeout to keep calling itself after 2^31 - 1 milliseconds
     *  until it can call setTimeout directly on the callback
     * @param {Function} callback [description]
     * @param {[type]}   time     [description]
     */
    _setTimeout(callback, time) {
        const MAX_TIME = Math.pow(2, 31) - 1;
        if(time > MAX_TIME) {
            this.timeout = setTimeout(() => {
                this._setTimeout(callback, time - MAX_TIME);
            }, MAX_TIME);
        }
        else {
            this.timeout = setTimeout(callback, time);
        }
    }

    setTimeout() {
        if(!this.reminderDate.isRecurring()) {
            this._setTimeout(() => {
                remindUser({userId: this.getUserId(), reminderId: this.getId(), reminderText: this.getText()});
            }, this.reminderDate.getMilliSecondsFromNow());
        }
        else {
            this._setTimeout(() => {
                remindUser({userId: this.getUserId(), reminderId: this.getId(), reminderText: this.getText()});
                this.setTimeout(); // next time it will be called with the next date
            }, this.reminderDate.getMilliSecondsFromNow());
        }
        
    }

    isEnabled() {
        return this.enabled;
    }

    disable() {
        this.clearTimeout();
        this.enabled = false;
    }

    clearTimeout() {
        if(this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    isInThePast() {
        return this.reminderDate.isInThePast();
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
            reminderDate: this.reminderDate.getSerializableObject(),
            id: this.id,
            userId: this.userId,
        };
    }

    getDateFormatted(timezone) {
        return this.reminderDate.getDateFormatted(timezone);
    }

    static deserialize(serializedReminderObject) {
        let reminderDate = ReminderDate.deserialize(serializedReminderObject.reminderDate);
        let reminder = new Reminder(serializedReminderObject.text, reminderDate, serializedReminderObject.userId);
        reminder.id = serializedReminderObject.id;
        reminder.dateCreated = moment(serializedReminderObject.dateCreated);
        return reminder;
    }
};