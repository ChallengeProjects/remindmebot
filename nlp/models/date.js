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
        this.setNLPTime(nlpObject instanceof NLPTime ? nlpObject : null, nlpTime);
    }

    getMomentDate(timezone, dateFormat) {
        let momentDate = moment.tz(timezone);
        if (!!this.nlpInterval) {
            momentDate = this.nlpInterval.getMomentDate(timezone);
        }
        else if (!!this.nlpDate) {
            momentDate = this.nlpDate.getMomentDate(timezone, dateFormat);
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

    // second gets the highest priority if both exist
    setNLPTime(first, second) {
        if (!first && !second) {
            return;
        }
        first = first || new NLPTime();
        second = second || new NLPTime();
        function merge(property) {
            if (!!first[property] && !!second[property]) {
                return second[property];
            }
            else {
                return first[property] || second[property];
            }
        }
        this.nlpTime = new NLPTime(merge("hour"), merge("minute"), merge("meridiem"));
    }

    mergeNLPTime(nlpTime) {
        this.setNLPTime(this.nlpTime, nlpTime);
    }

    clone() {
        let newNLPContainer = new NLPContainer();
        newNLPContainer.nlpTime = this.nlpTime;
        newNLPContainer.nlpDate = this.nlpDate;
        newNLPContainer.nlpInterval = this.nlpInterval;
        return newNLPContainer;
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
    constructor(year, month, day, n1, n2) {
        this.set(year, month, day, n1, n2);
    }

    getMomentDate(timezone, dateFormat) {
        let month, day;
        if (!!this.n1 && !!this.n2) {
            if (dateFormat == "d/m") {
                month = this.n2;
                day = this.n1;
            }
            else {
                month = this.n1;
                day = this.n2;
            }
        }
        else {
            if(!!this.month) {
                month = this.month;
            }
            if(!!this.day) {
                day = this.day;
            }
        }
        let momentDate = moment.tz(timezone);
        if (!!this.year) {
            momentDate.set({year: this.year});
        }
        if (!!month) {
            momentDate.set({month: month - 1});
        }
        if (!!day) {
            momentDate.set({date: day});
        }
        setAt12(momentDate);
        if (momentDate.isBefore(moment.tz(timezone))) {
            if (!month) {
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
            n1: this.n1,
            n2: this.n2,
        };
    }

    set(year, month, day, n1, n2) {
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
        if (typeof n1 == typeof '') {
            n1 = parseInt(n1);
        }
        if (typeof n2 == typeof '') {
            n2 = parseInt(n2);
        }
        this.n1 = n1;
        this.n2 = n2;
        this.year = year;
        this.month = month;
        this.day = day;
    }
}

class NLPInterval {
    constructor(numberOrNext, unit) {
        this.set(numberOrNext, unit);
    }

    getMomentDate(timezone) {
        let momentDate;
        if (this.isUnitAWeekDay) {
            // Algorithm:
            //  1- compute "on <weekday>"
            //  2- add n-1 weeks to the resulting date

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
            else {
                offsetDays = weekdayIndex - currentWeekDayIndex;
            }

            momentDate.add(offsetDays, 'day');

            let number = this.numberOrNext;
            if(this.numberOrNext == "next") {
                if (weekdayIndex % 7 == currentWeekDayIndex % 7) {
                    number = 1;
                }
                else {
                    number = 2;
                }
            }

            // 2-
            momentDate.add(number - 1, 'weeks');
        }
        else {
            // if it's not a week day, 'next' can be interpreted as 1
            // i.e next hour = in 1 hour
            let number = this.numberOrNext;
            if (this.numberOrNext == "next") {
                number = 1;
            }
            momentDate = moment.tz(timezone).add(number, this.unit);
        }

        if (['day', 'week', 'month', 'year', ...LOWER_CASE_WEEKDAYS].indexOf(this.unit) != -1) {
            setAt12(momentDate);
        }

        return momentDate;
    }

    get() {
        return {
            numberOrNext: this.numberOrNext,
            unit: this.unit,
        };
    }

    set(numberOrNext, unit) {
        if(numberOrNext == 'next') {
            this.numberOrNext = numberOrNext;
        }
        else if (typeof numberOrNext == typeof '') {
            numberOrNext = parseFloat(numberOrNext);
        }
        this.numberOrNext = numberOrNext || 1;
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