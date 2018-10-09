const User = require('./user.js'),
    fs = require('fs'),
    path = require('path'),
    sendMessageToUser = require("./botutils.js").sendMessageToUser;

let users = {}; // id:user

function updateStorage() {
    let serializedUsers = {};
    for(let userId in users) {
        serializedUsers[userId] = users[userId].getSerializableObject();
    }

    fs.writeFileSync(path.resolve(__dirname, 'users.json'), JSON.stringify(serializedUsers));
}


module.exports = class UserManager {
    static userExists(id) {
        return !!users[String(id)];
    }

    static getUserTimezone(id) {
        if(UserManager.userExists(id)) {
            return users[id].getTimezone();
        }
    }

    static getUserSortedFutureReminders(id, searchTerm) {
        if(UserManager.userExists(id)) {
            return users[id].getSortedFutureReminders(searchTerm);
        }
    }

    static enableReminder(userId, reminderId) {
        if(UserManager.userExists(userId)) {
            users[userId].enableReminder(reminderId);
            updateStorage();
        }
    }

    static disableReminder(userId, reminderId) {
        if(UserManager.userExists(userId)) {
            users[userId].disableReminder(reminderId);
            updateStorage();
        }
    }

    static getReminder(userId, reminderId) {
        if(UserManager.userExists(userId)) {
            return users[userId].getReminder(reminderId);
        }
    }

    static updateReminderText(userId, reminderId, text) {
        if(UserManager.userExists(userId)) {
            users[userId].updateReminderText(reminderId, text);
            updateStorage();
        }
        
    }

    static updateReminderDate(userId, reminderId, date) {
        if(UserManager.userExists(userId)) {
            users[userId].updateReminderDate(reminderId, date);
            updateStorage();
        }
    }

    static deleteReminder(userId, reminderId) {
        if(UserManager.userExists(userId)) {
            users[userId].deleteReminder(reminderId);
            updateStorage();
        }
    }

    static setUserTemporaryStore(id, obj) {
        if(UserManager.userExists(id)) {
            users[id].temporaryStore = obj;
        }
    }

    static getUserTemporaryStore(id) {
        if(UserManager.userExists(id)) {
            return users[id].temporaryStore;
        }
    }

    static setUserTimezone(userId, timezone) {
        if(UserManager.userExists(userId)) {
            users[userId].setTimezone(timezone);
            updateStorage();
        }
    }

    static addReminderForUser(userId, reminder) {
        if(UserManager.userExists(userId)) {
            users[userId].addReminder(reminder);
            updateStorage();
        }
    }

    static addUser(id, username) {
        if(UserManager.userExists(id)){
            return;
        }
        users[id] = new User(id, username);

        updateStorage();
    }

    static loadUsersDataFromStorage() {
        function deserializeUsers(usersSerialized) {
            let serializedUsers = JSON.parse(usersSerialized);
            let deserializedUsers = {};
            for(let userId in serializedUsers) {
                deserializedUsers[userId] = User.deserialize(serializedUsers[userId]);
            }

            return deserializedUsers;
        }

        try {
            let serializedUsers = fs.readFileSync(path.resolve(__dirname, 'users.json'));
            users = deserializeUsers(serializedUsers);
        } catch(err) {
            console.error('couldnt deserialize users', err);
            users = {};
        }
    }

    static sendFeatureUpdates() { 
        let updatesText = fs.readFileSync(path.resolve(__dirname, 'updates.txt')).toString("utf8");
        if(updatesText.length == 0) {
            return;
        }
        for(let userId in users) {
            sendMessageToUser({userId: userId, text: updatesText});
        }

        fs.writeFileSync(path.resolve(__dirname, 'updates.txt'), '');
    }
};