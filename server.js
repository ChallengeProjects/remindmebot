// small hack to set reminders through a RESTful API
const express = require('express'),
    bodyParser = require('body-parser'),
    remindercommand = require("./botfunctions/remindercommand.js"),
    config = require("./config.json")[process.env.NODE_ENV],
    logger = require("./logger.js");

let app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.post('/remindme', function(req, res) {
    if (config.botToken != req.body.botToken) {
        return;
    }
    logger.info("RESTFUL_API: req.body=" + JSON.stringify(req.body));

    function replyCallback(text) {
        text = text.replace(/<\/?[^>]*>/g, '');
        logger.info("RESTFUL_API: going to reply with: " + text);
        res.send(text);
        return { catch: function() {} };
    }
    let ctx = {
        message: {
            text: req.body.text
        },
        chat: {
            id: req.body.chatid
        },
        reply: replyCallback,
        replyWithHTML: replyCallback,
        update: {
            message: {
                message_id: 3 // number doesnt matter, just keep the structure intact
            }
        }
    };
    remindercommand.remindmeCallBack(ctx);
});

module.exports = app;