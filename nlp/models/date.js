const moment = require('moment-timezone');

const LOWER_CASE_WEEKDAYS = moment.weekdays().map(x => x.toLowerCase());
const TWELVE_HOURS_IN_MILLIS = 3600 * 1000 * 12;

function setAt12(momentDate) {
    momentDate.set({
        hour: 12,
        minute: 0,
        second: 0,
        millisecond: 0,
    });
}

class NLPContainer {
    constructor(nlpObject, nlpTime) {
        if (nlpObject instanceof NLPDate) {
            this.setNLPDate(nlpObject);
        }
        if (nlpObject instanceof NLPInterval) {
            this.setNLPInterval(nlpObject);
        }
        if (!!nlpTime) {
            this.setNLPTime(nlpTime);
        }
    }

    getMomentDate(timezone) {
        let momentDate = moment.tz(timezone);
        if (!!this.nlpInterval) {
            momentDate = this.nlpInterval.getMomentDate(timezone);
        }
        else if (!!this.nlpDate) {
            momentDate = this.nlpDate.getMomentDate(timezone);
        }

        if (!!this.nlpTime) {
            this.nlpTime.setMomentTimeParameters(momentDate, moment.tz(timezone), this.nlpDate, this.nlpInterval);
        }
        return momentDate;
    }

    getNLPDate() {
        return this.nlpDate;
    }

    getNLPTime() {
        return this.nlpTime;
    }

    getNLPInterval() {
        return this.nlpInterval;
    }

    setNLPDate(nlpDate) {
        this.nlpDate = nlpDate;
    }

    setNLPInterval(nlpInterval) {
        this.nlpInterval = nlpInterval;
    }

    setNLPTime(nlpTime) {
        this.nlpTime = nlpTime;
    }
}

class NLPTime {
    constructor(hour, minute, meridiem) {
        this.set(hour, minute, meridiem);
    }

    setMomentTimeParameters(momentDate, currentDate, nlpDate, nlpInterval) {
        let hour = this.hour;
        // 13 pm => 13, 12 pm => 12, 2 pm => 14
        if (this.meridiem == "pm" && hour < 12) {
            hour += 12;
        }
        momentDate.set({
            hour: hour,
            minute: this.minute,
            second: 0,
            millisecond: 0,
        });
        if (momentDate.isBefore(currentDate)) {
            // if no meridiem was specified and adding 12 hours would fix the issue then add it
            // checking if this.hour < 12 ensures that the user didnt specify the meridiem implicitly
            if (!this.meridiem && this.hour < 12 && currentDate.diff(momentDate) < TWELVE_HOURS_IN_MILLIS) {
                momentDate.add(12, 'hours');
            }
            // if no date was specified then add 1 day
            else if (!nlpDate && !nlpInterval) {
                momentDate.add(1, 'day');
            }
        }
    }
    set(hour, minute, meridiem) {
        if (typeof hour == typeof '') {
            hour = parseInt(hour);
        }
        this.hour = hour;

        if (typeof minute == typeof '') {
            minute = parseInt(minute);
        }
        if (!minute) {
            this.minute = 0;
        }
        else {
            this.minute = minute;
        }
        if(!!meridiem) {
            this.meridiem = meridiem.trim();
        }
    }

    get() {
        return {
            hour: this.hour,
            minute: this.minute,
            second: 0,
            meridiem: this.meridiem,
        };
    }

    getTextRepresentation() {
        let text = this.hour;
        if (!!this.minute) {
            text += ":" + this.minute;
        }
        if (!!this.meridiem) {
            text += " " + this.meridiem;
        }
        return text;
    }
}

class NLPDate {
    constructor(year, month, day, weekday) {
        this.set(year, month, day, weekday);
    }
    getMomentDate(timezone) {
        let momentDate = moment.tz(timezone);
        if (!!this.year) {
            momentDate.set({year: this.year});
        }
        if (!!this.month) {
            momentDate.set({month: this.month - 1});
        }
        if (!!this.day) {
            momentDate.set({date: this.day});
        }
        setAt12(momentDate);
        if (momentDate.isBefore(moment.tz(timezone))) {
            if (!this.month) {
                momentDate.add(1, 'month');
            }
            else if (!this.year) {
                momentDate.add(1, 'year');
            }

        }
        return moment.tz(momentDate.format("YYYY-MM-DDTHH:mm:ss"), timezone);
    }

    get() {
        return {
            year: this.year,
            month: this.month,
            day: this.day,
        };
    }

    set(year, month, day) {
        if(typeof year == typeof '') {
            year = parseInt(year);
            // 19 -> 2019
            if (year < 100) {
                year += 2000;
            }
        }
        if(typeof month == typeof '') {
            let parsedMonth = parseInt(month);
            if (isNaN(parsedMonth)) {
                month = month.trim();
                month = moment.months().map(m => m.toLowerCase()).indexOf(month) + 1;
            }
            else {
                month = parsedMonth;
            }
        }
        if(typeof day == typeof '') {
            day = parseInt(day);
        }
        this.year = year;
        this.month = month;
        this.day = day;
    }
}

class NLPInterval {
    constructor(number, unit) {
        this.set(number, unit);
    }

    getMomentDate(timezone) {
        let momentDate;
        if (this.isUnitAWeekDay) {
            // Algorithm:
            //  1- compute "on <weekday>"
            //  2- add n-1 weeks to the resulting date
            //  3- return "on mm/dd"

            // 1-
            let weekDay = this.unit;
            momentDate = moment.tz(timezone);
            let weekdayIndex = LOWER_CASE_WEEKDAYS.indexOf(weekDay);
            let currentWeekDayIndex = momentDate.isoWeekday();
            let offsetDays = 0;

            if (weekdayIndex % 7 == currentWeekDayIndex % 7) {
                offsetDays = 7;
            }
            else if (weekdayIndex < currentWeekDayIndex) {
                offsetDays = weekdayIndex + 7 - currentWeekDayIndex;
            }
            momentDate.add(offsetDays, 'day');
            // 2-
            momentDate.add(this.number - 1, 'weeks');
        } else {
            momentDate = moment().add(this.number, this.unit);
        }

        if (['day', 'week', 'month', 'year', ...LOWER_CASE_WEEKDAYS].indexOf(this.unit) != -1) {
            setAt12(momentDate);
        }

        return moment.tz(momentDate.format("YYYY-MM-DDTHH:mm:ss"), timezone);
    }

    get() {
        return {
            number: this.number,
            unit: this.unit,
        };
    }

    set(number, unit) {
        if (typeof number == typeof '') {
            number = parseFloat(number);
        }
        this.number = number || 1;
        if (!!unit) {
            unit = unit.toLowerCase();
            if (unit[unit.length -1] == 's') {
                unit = unit.substr(0, unit.length - 1);
            }
        }
        this.unit = unit;
        this.isUnitAWeekDay = LOWER_CASE_WEEKDAYS.indexOf(this.unit) != -1;
    }
}

module.exports = {
    NLPContainer: NLPContainer,
    NLPDate: NLPDate,
    NLPTime: NLPTime,
    NLPInterval: NLPInterval,
};