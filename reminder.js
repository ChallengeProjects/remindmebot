const moment = require('moment'),
    remindUser = require("./botutils.js").remindUser,
    ReminderDate = require("./reminderDate.js"),
    processTime = require('./processTime.js'),
    timemachine = require("timemachine");
// not sure if i need this here, but I had to use it in reminderDate.js
//  I don't know why need it there, but I do
//   without it, "sometimes" moment().unix() would return 0 in reminderDate.js
timemachine.reset();

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
        this.setReminderDate(reminderDate);
        this.dateCreated = moment.utc();
        this.id = generateGUID();
        this.userId = userId;
        this.enabled = true;
        this.timeouts = [];
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
     * setTimeout cant accept time that is > 2^31 - 1, this 
     *  function uses setTimeout to keep calling itself after 2^31 - 1 milliseconds
     *  until it can call setTimeout directly on the callback
     * @param {Function} callback [description]
     * @param {[type]}   time     [description]
     */
    _setTimeout(callback, time) {
        const MAX_TIME = Math.pow(2, 31) - 1;
        if(time > MAX_TIME) {
            this.timeouts.push(setTimeout(() => {
                this._setTimeout(callback, time - MAX_TIME);
            }, MAX_TIME));
        }
        else {
            this.timeouts.push(setTimeout(callback, time));
        }
    }

    setTimeout() {
        if(!this.reminderDate.isRecurring()) {
            let time = this.reminderDate.getMilliSecondsFromNow(this.timezone.getTimezone());
            console.log("setTimeout: Not recurring: text= ", this.getText(), "settimeout = ", time);
            this._setTimeout(() => {
                remindUser({userId: this.getUserId(), reminderId: this.getId(), reminderText: this.getText(), isRecurring: false});
            }, time);
        }
        else {
            console.log("setTimeout: Recurring: text= ", this.getText());
            for(let dateString of this.reminderDate.getDates()) {
                this.setTimeoutOneDate(dateString);
            }
        }   
    }

    setTimeoutOneDate(dateString) {
        let date = processTime.getDate("/remindme " + dateString + " to test", this.timezone.getTimezone()).reminderDate.date;
        console.log("\tsetTimeoutOneDate: date= ", date);
        this._setTimeout(() => {
            remindUser({userId: this.getUserId(), reminderId: this.getId(), reminderText: this.getText(), isRecurring: true});
            this.setTimeoutOneDate(dateString);
        }, (date.unix() - moment().unix()) * 1000);
    }

    isEnabled() {
        return this.enabled;
    }

    enable() {
        this.setTimeout();
        this.enabled = true;
    }

    disable() {
        this.clearTimeout();
        this.enabled = false;
    }

    clearTimeout() {
        for(let timeout of this.timeouts) {
            clearTimeout(timeout);
        }
    }

    isInThePast() {
        if(!this.reminderDate) {
            console.log("reminder date doesnt exist", this.getText());
            return true;
        }
        return this.reminderDate.isInThePast(this.timezone.getTimezone());
    }

    updateText(text) {
        this.text = text;
    }

    setReminderDate(date) {
        if(!date || !(date instanceof ReminderDate)) {
            console.log("ERROR: reminderDate is not of type ReminderDate: ", date, this.getText());
        }
        this.reminderDate = date;
    }

    updateDate(date) {
        this.clearTimeout();
        this.setReminderDate(date);
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

    getFormattedReminder(shortened) {
        let text = this.getText();
        if(text.length > 70) {
            text = shortened ? (text.slice(0, 70) + "…") : text;
        }
        let disabledText = !this.isEnabled() ? "[Disabled]" : "";
        return `<b>${disabledText} ${this.getDateFormatted(this.timezone.getTimezone())}:</b>\n${text}`;
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

    static deserialize(serializedReminderObject, timezone) {
        let reminderDate = ReminderDate.deserialize(serializedReminderObject.reminderDate);
        let reminder = new Reminder(serializedReminderObject.text, reminderDate, serializedReminderObject.userId);
        reminder.id = serializedReminderObject.id;
        reminder.dateCreated = moment(serializedReminderObject.dateCreated);
        reminder.enabled = serializedReminderObject.enabled;
        reminder.setTimezone(timezone);

        if(!reminder.isInThePast() && reminder.isEnabled()) {
            reminder.setTimeout();
        }
        return reminder;
    }
};