const Reminder = require('./reminder.js');

module.exports = class User {

    constructor(id, username, timezone) {
        this.id = id;
        this.username = username;
        this.timezone = timezone;
        this.reminders = {}; // reminder.id: reminder
    }

    setTimezone(timezone) {
        this.timezone = timezone;
    }

    updateReminderText(reminderId, text) {
        this.reminders[reminderId].updateText(text);
    }

    updateReminderDate(reminderId, date) {
        this.reminders[reminderId].updateDate(date);
    }

    enableReminder(reminderId) {
        this.reminders[reminderId].enable();
    }

    disableReminder(reminderId) {
        this.reminders[reminderId].disable();
    }

    addReminder(reminder) {
        this.reminders[reminder.getId()] = reminder;
        reminder.setTimeout();
    }

    deleteReminder(id) {
        if(this.reminders[id]) {
            this.reminders[id].clearTimeout();
            delete this.reminders[id];
        }
    }

    getSortedFutureReminders() {
        return Object.values(this.reminders)
            .filter(reminder => !reminder.isInThePast())
            .sort((r1, r2) => r1.getDate().valueOf() - r2.getDate().valueOf());
    }

    getReminder(id) {
        return this.reminders[id];
    }

    getTimezone() {
        return this.timezone;
    }

    getReminders() {
        return this.reminders;
    }

    getId() {
        return this.id;
    }

    hasReminder(reminderId) {
        return reminderId in this.reminders;
    }

    getSerializableObject() {
        let serializableReminderObject = {};
        for(let reminderId in this.reminders) {
            serializableReminderObject[reminderId] = this.reminders[reminderId].getSerializableObject();
        }
        return {
            id: this.id,
            username: this.username,
            timezone: this.timezone,
            reminders: serializableReminderObject,
        };
    }

    static deserialize(serializedUserObject) {
        let deserializedReminders = {};
        for(let reminderId in serializedUserObject.reminders) {
            deserializedReminders[reminderId] = Reminder.deserialize(serializedUserObject.reminders[reminderId]);
        }

        let deserializedUser = new User(serializedUserObject.id, serializedUserObject.username, serializedUserObject.timezone);
        deserializedUser.reminders = deserializedReminders;
        return deserializedUser;
    }
};
