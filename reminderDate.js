const moment = require('moment'),
    processTime = require('./processTime.js');

module.exports = class ReminderDate {
    /**
     * reminder date constructor
     * @param  {moment}   options.date            moment object with date
     * @param  {[String]} options.recurringDates  string of recurring reminder dates (["tomorrow at 5 pm", "on monday at 3 pm"])
     */
    constructor({date, recurringDates}) {
        if(date && recurringDates) {
            throw 'cant provide both date and recurringDates';
        }

        this.recurringDates = recurringDates;
        this.date = date;
    }

    isEnabled() {
        return this.enabled;
    }

    isRecurring() {
        return !!this.recurringDates;
    }

    getDate() {
        return this.date;
    }

    getDates() {
        return this.recurringDates;
    }

    /**
     * loops over all recurring dates and finds the closest one
     * @return {moment} next recurring date
     */
    _getNextRecurringDate() {
        if(!this.isRecurring()) {
            throw 'No recurring dates';
        }

        let sortedDates = this.recurringDates.map(rd => processTime.getDate("/remindme " + rd + " to test", "America/Los_Angeles").reminderDate.date)
            .sort((a, b) => a.unix() - b.unix());

        return sortedDates[0];
    }

    isInThePast() {
        return this.getMilliSecondsFromNow() < 0;
    }

    getMilliSecondsFromNow() {
        let date;
        if(this.isRecurring()) {
            date = this._getNextRecurringDate();
        }
        else {
            date = this.getDate();
        }

        return (date.unix() - moment().unix()) * 1000;
    }

    getDateFormatted(timezone) {
        if(this.isRecurring()) {
            return "recurring reminder:" + JSON.stringify(this.recurringDates);
        }
        
        let dateNow = moment.tz(timezone);
        let dateThen = moment.tz(this.date, timezone);
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
            return "on " + dateThen.format("dddd MM/DD") + " at " + time;
        }
        // else just give the full date
        else {
            return "on " + dateThen.format("dddd MM/DD/YYYY") + " at " + time;
        }
    }

    
    getSerializableObject() {
        return {
            date: this.date ? this.date.valueOf() : undefined,
            recurringDates: this.recurringDates
        };
    }

    static deserialize(serializedReminderDateObject) {
        // one time thing
        if(typeof serializedReminderDateObject == typeof 3) {
            let x = new ReminderDate({
                date: moment(serializedReminderDateObject)
            });
            return x;
        }
        // end one time thing

        let date = undefined;
        if(serializedReminderDateObject.date) {
            date = moment(serializedReminderDateObject.date);
        }
        return new ReminderDate({
            date: date,
            recurringDates: serializedReminderDateObject.recurringDates,
        });
    }

};