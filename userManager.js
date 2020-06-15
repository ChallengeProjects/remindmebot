const User = require('./models/user.js'),
    fs = require('fs'),
    path = require('path'),
    sendMessageToUser = require("./botutils.js").sendMessageToUser,
    config = require("./"+process.env["config"])[process.env.NODE_ENV];

let users = {}; // id:user
let reminderCallback;

const USERS_FILE_NAME = config.usersFileName;
const USERS_FILE_PATH = path.resolve(__dirname, USERS_FILE_NAME);
const UPDATES_FILE_PATH = path.resolve(__dirname, 'updates.txt');
const BACKUP_DIRECTORY_PATH = path.resolve(__dirname, 'users_backup');

function updateStorage() {
    let serializedUsers = {};
    for (let userId in users) {
        try {
            serializedUsers[userId] = users[userId].getSerializableObject();
        } catch (err) {
            console.log("Couldn't serialize user: ", userId);
        }
    }

    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(serializedUsers));
}
// We need to update the storage periodically because changes in the users object
//  can happen from within the reminder.js file asynchronously (see research/problem2.txt)
// Other alternative would be object watching, which doesnt look that much better to
//  me than a periodic save
setInterval(updateStorage, 1000);


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
        }
    }

    static disableReminder(userId, reminderId) {
        if (UserManager.userExists(userId)) {
            users[userId].disableReminder(reminderId);
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
        }

    }

    static updateReminderDate(userId, reminderId, date) {
        if (UserManager.userExists(userId)) {
            users[userId].updateReminderDate(reminderId, date);
        }
    }

    static deleteReminder(userId, reminderId) {
        if (UserManager.userExists(userId)) {
            users[userId].deleteReminder(reminderId);
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
    }

    static addReminderForUser(userId, reminder) {
        if (!!reminderCallback) {
            reminder.setReminderCallback(reminderCallback);
        }
        if (UserManager.userExists(userId)) {
            users[userId].addReminder(reminder);
        }
    }


    static addUser(id, username, firstName, lastName, timezone) {
        if (UserManager.userExists(id)) {
            return;
        }
        users[id] = new User(id, username, firstName, lastName, timezone);
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

    static loadUsersDataFromStorage(remindercb) {
        reminderCallback = remindercb;
        UserManager.backupUsersData();

        function deserializeUsers(usersSerialized) {
            let serializedUsers = JSON.parse(usersSerialized);
            let deserializedUsers = {};
            for (let userId in serializedUsers) {
                try {
                    deserializedUsers[userId] = User.deserialize(serializedUsers[userId], reminderCallback);
                } catch (err) {
                    console.log("Couldn't deserialize user: ", userId);
                }
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