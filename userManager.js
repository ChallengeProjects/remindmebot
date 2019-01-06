const User = require('./user.js'),
    fs = require('fs'),
    path = require('path'),
    sendMessageToUser = require("./botutils.js").sendMessageToUser;

let users = {}; // id:user

const USERS_FILE_PATH = path.resolve(__dirname, 'users.json');
const UPDATES_FILE_PATH = path.resolve(__dirname, 'updates.txt');

function updateStorage() {
    let serializedUsers = {};
    for(let userId in users) {
        serializedUsers[userId] = users[userId].getSerializableObject();
    }

    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(serializedUsers));
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

    static getUserSortedFutureReminders(id, searchTerm, isRecurring) {
        if(UserManager.userExists(id)) {
            return users[id].getSortedFutureReminders(searchTerm, isRecurring);
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

    static deleteUser(id) {
        if(UserManager.userExists(id)){
            return;
        }

        // first clean up all reminders
        for(let reminderId in users[id].getReminders()) {
            UserManager.deleteReminder(id, reminderId);
        }

        delete users[id];

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
            if (!fs.existsSync(USERS_FILE_PATH)) {
                fs.writeFileSync(USERS_FILE_PATH, '{}');
            }
            let serializedUsers = fs.readFileSync(USERS_FILE_PATH);
            users = deserializeUsers(serializedUsers);
        } catch(err) {
            console.error('couldnt deserialize users', err);
            users = {};
        }
    }
    
    static sendFeatureUpdates() { 
        if (!fs.existsSync('updates.txt')) {
            return;
        }
        let updatesText = fs.readFileSync(UPDATES_FILE_PATH).toString("utf8");
        if(updatesText.length == 0) {
            return;
        }
        let header = "**Bot updates:** \n\n";
        for(let userId in users) {
            sendMessageToUser({userId: userId, text: header + updatesText});
        }

        fs.writeFileSync(UPDATES_FILE_PATH, '');
    }
};