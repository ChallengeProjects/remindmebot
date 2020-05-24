const Reminder = require('./reminder.js'),
    Timezone = require("./timezone.js");

module.exports = class User {
    constructor(id, username, timezone) {
        this.id = id;
        this.username = username;
        this.timezone = timezone;
        this.reminders = {}; // reminder.id: reminder
    }

    setTimezone(timezone) {
        if (typeof timezone == 'string') {
            this.timezone = new Timezone(timezone);
        }
        else {
            this.timezone = timezone;
        }
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
        reminder.setTimezone(this.timezone);
        reminder.setTimeout();
    }

    deleteReminder(id) {
        if (this.reminders[id]) {
            this.reminders[id].clearTimeout();
            delete this.reminders[id];
        }
    }

    getSortedFutureReminders(searchTerm, isRecurring) {
        let sortedRemindersInThePast = Object.values(this.reminders)
            .filter(reminder => !reminder.isInThePast() && reminder.isRecurring() == isRecurring)
            .sort((r1, r2) => r1.getDate().valueOf() - r2.getDate().valueOf());
        if (searchTerm) {
            return sortedRemindersInThePast
                .filter(reminder => reminder.text.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        else {
            return sortedRemindersInThePast;
        }
    }

    getReminder(id) {
        return this.reminders[id];
    }

    getTimezone() {
        return this.timezone ? this.timezone.getTimezone() : null;
    }

    getDateFormat() {
        return "m/d";
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
        for (let reminderId in this.reminders) {
            try {
                if (!this.reminders[reminderId].isInThePast()) {
                    serializableReminderObject[reminderId] = this.reminders[reminderId].getSerializableObject();
                }
            } catch (err) {
                console.log("Couldn't serialize reminder: ", reminderId);
            }
        }
        let serializableTimezoneObject;
        if (this.timezone) {
            serializableTimezoneObject = this.timezone.getSerializableObject();
        }

        return {
            id: this.id,
            username: this.username,
            timezone: serializableTimezoneObject,
            reminders: serializableReminderObject,
        };
    }

    static deserialize(serializedUserObject) {
        let timezone;
        if (serializedUserObject.timezone) {
            timezone = Timezone.deserialize(serializedUserObject.timezone);
        }
        let deserializedReminders = {};
        for (let reminderId in serializedUserObject.reminders) {
            try {
                deserializedReminders[reminderId] = Reminder.deserialize(serializedUserObject.reminders[reminderId], timezone);
            } catch (err) {
                console.log("Couldn't deserialize reminder: ", reminderId);
            }
        }
        let deserializedUser = new User(serializedUserObject.id, serializedUserObject.username, timezone);
        deserializedUser.reminders = deserializedReminders;
        return deserializedUser;
    }
};