const winston = require('winston'),
    config = require("./config.json")[process.env.NODE_ENV];

require('winston-papertrail').Papertrail;

if (!config.papertrail) {
    module.exports = { info: console.log };
} else {
    let winstonPapertrail = new winston.transports.Papertrail(config.papertrail);

    let logger = new winston.Logger({
        transports: [winstonPapertrail]
    });

    let copyOfLoggerInfo = logger.info;

    // print to stdout and papertrail
    logger.info = function(msg) {
        console.log(msg);
        copyOfLoggerInfo(msg);
    };

    module.exports = logger;
}