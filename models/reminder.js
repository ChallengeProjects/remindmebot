const moment = require('moment'),
    { remindUser, encodeHTMLEntities } = require("../botutils.js"),
    ReminderDate = require("./reminderDate.js"),
    processTime = require('../nlp/processTime.js');

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
     * @param {string}       userId        id of user
     */
    constructor(text, reminderDate, userId, reminderCallback) {
        this.text = text;
        this.setReminderDate(reminderDate);
        this.dateCreated = moment.utc();
        this.id = generateGUID();
        this.userId = userId;
        this.enabled = true;
        this.timeouts = [];
        this.reminderCallback = reminderCallback || remindUser;
    }

    setReminderCallback(reminderCallback) {
        this.reminderCallback = reminderCallback;
    }

    setTimezone(timezone) {
        this.timezone = timezone;
    }

    getUserId() {
        return this.userId;
    }

    isRecurring() {
        return this.reminderDate.isRecurring();
    }

    /**
     * global.setTimeout can't accept time that is > 2^31 - 1, this 
     *  function uses setTimeout to keep calling itself after 2^31 - 1 milliseconds
     *  until it can call setTimeout directly on the callback
     * @param {Function} callback
     * @param {[type]}   time
     */
    _setTimeout(callback, time) {
        const MAX_TIME = Math.pow(2, 31) - 1;
        if (time > MAX_TIME) {
            this.timeouts.push(global.setTimeout(() => {
                this._setTimeout(callback, time - MAX_TIME);
            }, MAX_TIME));
        }
        else {
            this.timeouts.push(global.setTimeout(callback, time));
        }
    }

    setTimeout(isResetup) {
        if (!this.reminderDate.isRecurring()) {
            let time = this.reminderDate.getMilliSecondsFromNow(this.timezone.getTimezone());
            this._setTimeout(() => {
                this.reminderCallback(this);
            }, time);
        }
        // if recurring reminder
        else {
            for (let recurringDate of this.reminderDate.getRecurringDates()) {
                this._setTimeoutOneRecurringDate(recurringDate, isResetup);
            }
        }
    }

    _setTimeoutOneRecurringDate(recurringDate, isResetup) {
        let dateString = recurringDate.dateString;
        console.log(`before setting: _setTimeoutOneRecurringDate: ${this.getShortenedText(10)} ${recurringDate.nextReminderTime ? recurringDate.nextReminderTime.unix() : "no nextReminderTime yet"}`);
        // if its a re-setup dont change the nextReminderTime
        // only change the nextReminderTime if its not a Resetup
        if(!isResetup) {
            recurringDate.nextReminderTime = processTime.getDate("/remindme " + dateString + " to test", this.timezone.getTimezone()).reminderDates.dates[0];
            console.log(`after setting _setTimeoutOneRecurringDate: ${this.getShortenedText(10)} ${recurringDate.nextReminderTime.unix()}`);
        }
        this._setTimeout(() => {
            // check if the ending date condition has passed
            // clear the timeout and dont set another one
            if (this.isInThePast()) {
                this.clearTimeout();
                return;
            }
            this.reminderCallback(this);

            recurringDate.nextReminderTime = processTime.getDate("/remindme " + dateString + " to test", this.timezone.getTimezone()).reminderDates.dates[0];
            this._setTimeoutOneRecurringDate(recurringDate);
        }, (recurringDate.nextReminderTime.unix() - moment().unix()) * 1000);
    }

    isEnabled() {
        return this.enabled;
    }

    enable() {
        this.setTimeout(false);
        this.enabled = true;
    }

    disable() {
        this.clearTimeout();
        this.enabled = false;
    }

    clearTimeout() {
        for (let timeout of this.timeouts) {
            global.clearTimeout(timeout);
        }
    }

    isInThePast() {
        if (!this.reminderDate) {
            console.log("reminder date doesnt exist", this.getText());
            return true;
        }
        return this.reminderDate.isInThePast(this.timezone.getTimezone());
    }

    updateText(text) {
        this.text = text;
    }

    setReminderDate(date) {
        if (!date || !(date instanceof ReminderDate)) {
            console.log("ERROR: reminderDate is not of type ReminderDate: ", date, this.getText());
        }
        this.reminderDate = date;
    }

    updateDate(date) {
        this.clearTimeout();
        this.setReminderDate(date);
        this.setTimeout(false);
    }

    getText() {
        return this.text;
    }

    getShortenedText(length) {
        if (!length) {
            length = 70;
        }
        return this.getText().slice(0, 70) + (this.getText().length > 70 ? "…" : "");
    }

    getDateCrated() {
        return this.dateCreated;
    }

    getDate() {
        return this.reminderDate;
    }

    getFormattedReminder(isShortened) {
        let text = encodeHTMLEntities(isShortened ? this.getShortenedText() : this.getText());

        let formattedDate = this.getDateFormatted();
        if (formattedDate.length > 70) {
            formattedDate = isShortened ? (formattedDate.slice(0, 70) + "…") : formattedDate;
        }

        if(!this.isEnabled()) {
            let disabledText = !this.isEnabled() ? "[Disabled]" : "";
            return `<code>${disabledText} ${formattedDate}:</code>\n${text}`;
        }
        else {
            return `<code>${formattedDate}:</code>\n${text}`;
        }
    }

    getId() {
        return this.id;
    }

    getSnoozedReminder(snoozePeriodInMilliSeconds) {
        let snoozedReminderDate = new ReminderDate({
            date: moment(moment().valueOf() + snoozePeriodInMilliSeconds)
        });
        return new Reminder(this.text, snoozedReminderDate, this.getUserId());
    }

    getSerializableObject() {
        return {
            text: this.text,
            dateCreated: this.dateCreated.valueOf(),
            reminderDate: this.reminderDate.getSerializableObject(),
            id: this.id,
            userId: this.userId,
            enabled: this.enabled,
        };
    }

    getDateFormatted() {
        return this.reminderDate.getDateFormatted(this.timezone.getTimezone());
    }

    static deserialize(serializedReminderObject, timezone, reminderCallback) {
        let reminderDate = ReminderDate.deserialize(serializedReminderObject.reminderDate);
        let reminder = new Reminder(serializedReminderObject.text, reminderDate, serializedReminderObject.userId, reminderCallback);
        reminder.id = serializedReminderObject.id;
        reminder.dateCreated = moment(serializedReminderObject.dateCreated);
        reminder.enabled = serializedReminderObject.enabled;
        reminder.setTimezone(timezone);

        if (!reminder.isInThePast() && reminder.isEnabled()) {
            reminder.setTimeout(true);
        }
        return reminder;
    }
};