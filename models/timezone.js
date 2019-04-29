module.exports = class Timezone {
    constructor(timezone) {
        this.timezone = timezone;
    }

    getTimezone() {
        return this.timezone;
    }

    setTimezone(timezone) {
        this.timezone = timezone;
    }

    getSerializableObject() {
        return {
            timezone: this.timezone
        };
    }

    static deserialize(serializedTimezoneObject) {
        return new Timezone(serializedTimezoneObject.timezone);
    }
};