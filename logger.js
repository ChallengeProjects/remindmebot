const winston = require('winston'),
    config = require("./config.json");

require('winston-papertrail').Papertrail;

var winstonPapertrail = new winston.transports.Papertrail(config.papertrail);

var logger = new winston.Logger({
    transports: [winstonPapertrail]
});

module.exports = logger;