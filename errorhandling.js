const UserManager = require("./userManager.js"),
    logger = require("./logger.js");

function catchBlocks(error) {
    if(error.code == 403) {
        logger.info("User blocked bot, deleting user");
    }
    else {
        logger.info("Unkown error, deleting user: ", JSON.stringify(error));
    }
    UserManager.delete(error.on.payload.chat_id);
}

module.exports = {
    catchBlocks: catchBlocks
};