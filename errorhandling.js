const UserManager = require("./userManager.js"),
    logger = require("./logger.js");

function catchBlocks(error) {
    if (error.code == 403) {
        logger.info("User blocked bot, deleting user");
        UserManager.deleteUser(error.on.payload.chat_id);
    }
    else {
        logger.info("Unkown error: ", JSON.stringify(error));
    }
}

module.exports = {
    catchBlocks: catchBlocks
};