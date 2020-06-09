const fbutils = require("./fbutils.js");

function reminderCallback(reminder) {
    let userId = reminder.getUserId();
    fbutils.sendFBTextMessage(userId, reminder.getText());
}

module.exports = {
    reminderCallback: reminderCallback,
};