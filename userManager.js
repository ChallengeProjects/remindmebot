const User = require('./user.js'),
    fs = require('fs'),
    path = require('path'),
    sendMessageToUser = require("./botutils.js").sendMessageToUser;

let users = {}; // id:user

const USERS_FILE_NAME = 'users.json';
const USERS_FILE_PATH = path.resolve(__dirname, USERS_FILE_NAME);
const UPDATES_FILE_PATH = path.resolve(__dirname, 'updates.txt');
const BACKUP_DIRECTORY_PATH = path.resolve(__dirname, 'users_backup');

function updateStorage() {
    let serializedUsers = {};
    for (let userId in users) {
        serializedUsers[userId] = users[userId].getSerializableObject();
    }

    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(serializedUsers));
}


module.exports = class UserManager {
    static userExists(id) {
        return !!users[String(id)];
    }

    static getUserTimezone(id) {
        if (UserManager.userExists(id)) {
            return users[id].getTimezone();
        }
    }

    static getUserSortedFutureReminders(id, searchTerm, isRecurring) {
        if (UserManager.userExists(id)) {
            return users[id].getSortedFutureReminders(searchTerm, isRecurring);
        }
    }

    static enableReminder(userId, reminderId) {
        if (UserManager.userExists(userId)) {
            users[userId].enableReminder(reminderId);
            updateStorage();
        }
    }

    static disableReminder(userId, reminderId) {
        if (UserManager.userExists(userId)) {
            users[userId].disableReminder(reminderId);
            updateStorage();
        }
    }

    static getReminder(userId, reminderId) {
        if (UserManager.userExists(userId)) {
            return users[userId].getReminder(reminderId);
        }
    }

    static updateReminderText(userId, reminderId, text) {
        if (UserManager.userExists(userId)) {
            users[userId].updateReminderText(reminderId, text);
            updateStorage();
        }

    }

    static updateReminderDate(userId, reminderId, date) {
        if (UserManager.userExists(userId)) {
            users[userId].updateReminderDate(reminderId, date);
            updateStorage();
        }
    }

    static deleteReminder(userId, reminderId) {
        if (UserManager.userExists(userId)) {
            users[userId].deleteReminder(reminderId);
            updateStorage();
        }
    }

    static setUserTemporaryStore(id, obj) {
        if (UserManager.userExists(id)) {
            users[id].temporaryStore = obj;
        }
    }

    static getUserTemporaryStore(id) {
        if (UserManager.userExists(id)) {
            return users[id].temporaryStore;
        }
    }

    static setUserTimezone(userId, timezone) {
        if (!UserManager.userExists(userId)) {
            UserManager.addUser(userId);
        }
        users[userId].setTimezone(timezone);
        updateStorage();
    }

    static addReminderForUser(userId, reminder) {
        if (UserManager.userExists(userId)) {
            users[userId].addReminder(reminder);
            updateStorage();
        }
    }

    static addUser(id, username) {
        if (UserManager.userExists(id)) {
            return;
        }
        users[id] = new User(id, username);

        updateStorage();
    }

    static deleteUser(id) {
        if (UserManager.userExists(id)) {
            return;
        }

        // first clean up all reminders
        for (let reminderId in users[id].getReminders()) {
            UserManager.deleteReminder(id, reminderId);
        }

        delete users[id];

        updateStorage();
    }

    static backupUsersData() {
        if (fs.existsSync(BACKUP_DIRECTORY_PATH) && !fs.lstatSync(BACKUP_DIRECTORY_PATH).isDirectory()) {
            throw "BACKUP_DIRECTORY_PATH is not a directory";
        }
        if (!fs.existsSync(BACKUP_DIRECTORY_PATH)) {
            fs.mkdirSync(BACKUP_DIRECTORY_PATH);
        }
        if (!fs.existsSync(USERS_FILE_PATH)) {
            return;
        }
        // format of files is `{USERS_FILE_NAME}-<index>`
        // parse the index out, get the max index and add 1 to the current backup
        let maximumIndex = Math.max(...fs.readdirSync(BACKUP_DIRECTORY_PATH)
            .map(fileName => parseInt(fileName.replace(USERS_FILE_NAME + '-', ''))));
        if (maximumIndex == -Infinity) {
            maximumIndex = 0;
        }

        let newBackupFileName = USERS_FILE_NAME + '-' + (maximumIndex + 1);
        fs.copyFileSync(
            USERS_FILE_PATH,
            path.resolve(BACKUP_DIRECTORY_PATH, newBackupFileName)
        );
    }

    static loadUsersDataFromStorage() {
        UserManager.backupUsersData();

        function deserializeUsers(usersSerialized) {
            let serializedUsers = JSON.parse(usersSerialized);
            let deserializedUsers = {};
            for (let userId in serializedUsers) {
                deserializedUsers[userId] = User.deserialize(serializedUsers[userId]);
            }
            return deserializedUsers;
        }

        try {
            if (!fs.existsSync(USERS_FILE_PATH)) {
                fs.writeFileSync(USERS_FILE_PATH, '{}');
            }
            let serializedUsers = fs.readFileSync(USERS_FILE_PATH);
            if (serializedUsers.length == 0) {
                serializedUsers = '{}';
                fs.writeFileSync(USERS_FILE_PATH, serializedUsers);
            }
            users = deserializeUsers(serializedUsers);
        } catch (err) {
            console.error('couldnt deserialize users', err);
            users = {};
        }
    }

    static sendFeatureUpdates() {
        if (!fs.existsSync('updates.txt')) {
            return;
        }
        let updatesText = fs.readFileSync(UPDATES_FILE_PATH).toString("utf8");
        if (updatesText.length == 0) {
            return;
        }
        let header = "**Bot updates:** \n\n";
        for (let userId in users) {
            sendMessageToUser({ userId: userId, text: header + updatesText });
        }

        fs.writeFileSync(UPDATES_FILE_PATH, '');
    }
};