const winston = require('winston'),
    config = require("./config.json")[process.env.NODE_ENV];

require('winston-papertrail').Papertrail;

if (!config.papertrail) {
    module.exports = { info: console.log };
} else {
    var winstonPapertrail = new winston.transports.Papertrail(config.papertrail);

    var logger = new winston.Logger({
        transports: [winstonPapertrail]
    });

    module.exports = logger;
}