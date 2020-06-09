const winston = require('winston'),
    config = require("./"+process.env["config"])[process.env.NODE_ENV];

require('winston-papertrail').Papertrail;

if (!config.papertrail) {
    let customLogger = function(log) {
        console.log("[" + new Date() + "]", log);
    };
    module.exports = { info: customLogger };
}
else {
    let winstonPapertrail = new winston.transports.Papertrail(config.papertrail);

    let logger = new winston.Logger({
        transports: [winstonPapertrail]
    });

    let copyOfLoggerInfo = logger.info;

    // print to stdout and papertrail
    logger.info = function(msg) {
        console.log("[" + new Date() + "] LOGGER_INFO:" + msg);
        copyOfLoggerInfo(msg);
    };

    module.exports = logger;
}