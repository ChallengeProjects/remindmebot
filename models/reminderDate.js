const moment = require('moment'),
    processTime = require('../nlp/processTime.js'),
    timemachine = require("timemachine");
// I don't know why I need this here, but I do
//   without it, "sometimes" moment().unix() would return 0 in this file
timemachine.reset();

module.exports = class ReminderDate {
    /**
     * reminder date constructor
     * @param  {moment}   options.date            moment object with date
     * @param  {[String]} options.recurringDates  string of recurring reminder dates (["tomorrow at 5 pm", "on monday at 3 pm"])
     */
    constructor({ date, recurringDates, endingConditionDate }) {
        if ((date && recurringDates) || (date && endingConditionDate)) {
            throw 'cant provide both (date and recurringDates) or (date and endingConditionDate)';
        }

        if(recurringDates && recurringDates.length) {
            if(typeof recurringDates[0] == 'string') {
                this.recurringDates = recurringDates.map(x => ({dateString: x}));
            }
            else {
                this.recurringDates = recurringDates;
            }
        }
        this.endingConditionDate = endingConditionDate;
        this.date = date;
    }

    isEnabled() {
        return this.enabled;
    }

    isRecurring() {
        return !!this.recurringDates;
    }

    valueOf() {
        if (this.date) {
            return this.date.valueOf();
        }
        else {
            return this._getNextRecurringDate.valueOf();
        }
    }

    getDate() {
        return this.date;
    }

    getRecurringDates() {
        return this.recurringDates;
    }

    /**
     * loops over all recurring dates and finds the closest one
     * @return {moment} next recurring date
     */
    _getNextRecurringDate(timezone) {
        if (!this.isRecurring()) {
            throw 'No recurring dates';
        }

        let sortedNextReminderDates = this.recurringDates.map(rd => rd.nextReminderTime).filter(nrt => !!nrt).sort((a, b) => a.unix() - b.unix());
        if(sortedNextReminderDates.length) {
            return sortedNextReminderDates[0];
        }

        console.log("recurringDates=", this.recurringDates);
        let sortedDates = this.recurringDates.map(rd => processTime.getDate("/remindme " + rd.dateString + " to test", timezone).reminderDates.dates[0])
            .sort((a, b) => a.unix() - b.unix());

        console.log("sortedDates=", sortedDates);
        return sortedDates[0];
    }

    isInThePast(timezone) {
        if (this.isRecurring()) {
            if (!this.endingConditionDate) {
                return false;
            }
            else {
                return this.endingConditionDate.unix() < moment().unix();
            }
        }
        // console.log(`isInThePast: msFromNow: ${this.getMilliSecondsFromNow(timezone)}, momentnow:${moment().unix()}, date: ${new Date().getTime()/1000}`);
        return this.getMilliSecondsFromNow(timezone) < 0;
    }

    getMilliSecondsFromNow(timezone) {
        let date;
        if (this.isRecurring()) {
            date = this._getNextRecurringDate(timezone);
        }
        else {
            date = this.getDate();
        }

        // console.log("getMilliSecondsFromNow: date=", date.unix(), "now=", moment().unix());
        return (date.unix() - moment().unix()) * 1000;
    }

    getDateFormatted(timezone) {
        if (this.isRecurring()) {
            let date = this._getNextRecurringDate(timezone);
            let nextTime = this._getDateFormatted(date, timezone);
            let endingDateText = "";
            if (this.endingConditionDate) {
                let endingDateFormatted = this._getDateFormatted(this.endingConditionDate, timezone);
                endingDateText = `\nEnd date: ${endingDateFormatted}`;
            }
            let dateStrings = this.recurringDates.map(rd => rd.dateString);
            return `next time: ${nextTime}, all times: ${JSON.stringify(dateStrings)}${endingDateText}`;
        }
        else {
            return this._getDateFormatted(this.date, timezone);
        }
    }

    _getDateFormatted(date, timezone) {
        let dateNow = moment.tz(timezone);
        let dateThen = moment.tz(date, timezone);
        let time;

        // if minute is 0 then just give the hour
        if (dateThen.format("mm") == "00") {
            time = dateThen.format("h a");
        }
        else {
            time = dateThen.format("h:mm a");
        }

        // if same day just give time
        if (dateNow.isSame(dateThen, 'day')) {
            return `at ${time}`;
        }
        // if it's tomorrow say tomorrow(<weekday>)
        else if (dateNow.clone().add(1, 'day').isSame(dateThen, 'd')) {
            return `tomorrow (${dateThen.format('dddd')}) at ${time}`; // tomorrow (Wednesday) at 3:04 pm
        }
        // if same month just give week day and month day
        else if (dateNow.isSame(dateThen, 'month')) {
            return `on ${dateThen.format("dddd")} the ${dateThen.format("Do")} at ${time}`; // on Monday the 12th at 3:04 pm
        }
        // if same year just give MM/DD
        else if (dateNow.isSame(dateThen, 'year')) {
            return `on ${dateThen.format("dddd MM/DD")} at ${time}`;
        }
        // else just give the full date
        else {
            return `on ${dateThen.format("dddd MM/DD/YYYY")} at ${time}`;
        }
    }

    getSerializableObject() {
        let recurringDates = undefined;

        if(this.recurringDates) {
            recurringDates = [];
            for(let recurringDate of this.recurringDates) {
                recurringDates.push({
                    dateString: recurringDate.dateString,
                    nextReminderTime: recurringDate.nextReminderTime.valueOf(),
                });
            }
        }
        return {
            date: this.date ? this.date.valueOf() : undefined,
            endingConditionDate: this.endingConditionDate ? this.endingConditionDate.valueOf() : undefined,
            recurringDates: recurringDates
        };
    }

    static deserialize(serializedReminderDateObject) {
        let date = undefined;
        let endingConditionDate = undefined;
        let deserializedRecurringDates = undefined;
        if (serializedReminderDateObject.date) {
            date = moment(serializedReminderDateObject.date);
        }
        if (serializedReminderDateObject.endingConditionDate) {
            endingConditionDate = moment(serializedReminderDateObject.endingConditionDate);
        }
        if(serializedReminderDateObject.recurringDates) {
            deserializedRecurringDates = [];
            for(let recurringDate of serializedReminderDateObject.recurringDates) {
                // one time process
                if(typeof recurringDate == 'string') {
                    deserializedRecurringDates.push({
                        dateString: recurringDate,
                    });
                }
                else {
                    deserializedRecurringDates.push({
                        dateString: recurringDate.dateString,
                        nextReminderTime: moment(recurringDate.nextReminderTime),
                    });
                }
            }
        }
        return new ReminderDate({
            date: date,
            recurringDates: deserializedRecurringDates,
            endingConditionDate: endingConditionDate,
        });
    }
};