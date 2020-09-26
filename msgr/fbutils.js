// message tags: https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags/
const https = require('https'),
    dateutils = require("../utils/dateutils.js"),
    config = require("../"+process.env["config"])[process.env.NODE_ENV];

const FB_ACCESS_TOKEN = config.botToken;

const _makeHttpCall = (options, fbId = undefined) => {
    return new Promise((resolve) => {
        let req = https.request(options, res => {
            res.setEncoding('utf8');
            let returnData = "";
            res.on('data', chunk => {
                returnData = returnData + chunk;
            });
            res.on('end', () => {
                let results = JSON.parse(returnData);
                if (!!fbId) {
                    results.fbId = fbId;
                }
                resolve(results);
            });
        });
        if (options.method == 'POST' || options.method == 'PATCH') {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
};

const sendFBTextMessageWithCards = (fbId, message, messagingType = "UPDATE", tag = undefined) => {
    let msg = {
        messaging_type: messagingType,
        tag: tag,
        recipient: {
            id: fbId
        },
        message: message,
    };
    console.log("<cards> msg=", msg);

    let options = {
        host: 'graph.facebook.com',
        path: '/v2.6/me/messages?access_token=' + FB_ACCESS_TOKEN,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: msg,
    };

    return new Promise((resolve, reject) => {
        _makeHttpCall(options).then(resp => {
            if ("error" in resp) {
                console.log("<cards> couldnt send msg to", fbId, resp);
                resp["recipient_id"] = fbId;
                reject(resp);
            }
            else {
                resolve(resp);
            }
        });
    });
};

const sendFBTextMessageWithRealCards = (fbId, messageWithCard, messagingType = "UPDATE", tag = undefined) => {
    let msg = {
        messaging_type: messagingType,
        tag: tag,
        recipient: {
            id: fbId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    "template_type": "generic",
                    "elements": [messageWithCard]
                }
            }
        }
    };

    let options = {
        host: 'graph.facebook.com',
        path: '/v2.6/me/messages?access_token=' + FB_ACCESS_TOKEN,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: msg,
    };

    return new Promise((resolve, reject) => {
        _makeHttpCall(options).then(resp => {
            if ("error" in resp) {
                console.log("<cards> couldnt send msg to", fbId, resp);
                resp["recipient_id"] = fbId;
                reject(resp);
            }
            else {
                resolve(resp);
            }
        });
    });
};

const sendFBTextMessage = (fbId, text, messagingType = "UPDATE", tag = undefined) => {
    let textChunks;
    if (text && text.length > 2000) {
        textChunks = text.match(/(.|[\r\n]){1,2000}/g);
    }
    else {
        textChunks = [text];
    }
    let promise = new Promise(resolve => {
        resolve();
    });
    for (let i = 0; i < textChunks.length; i++) {
        let message = {
            text: textChunks[i],
        };

        promise = promise.then(() => {
            return sendFBTextMessageWithCards(fbId, message, messagingType, tag);
        });
    }
    return promise;
};

function extractText(msg) {
    if (msgingZeroExists(msg) && !!msg.entry[0].messaging[0].message) {
        return msg.entry[0].messaging[0].message.text;
    }
}

function extractfbId(msg) {
    if (msgingZeroExists(msg) && !!msg.entry[0].messaging[0].sender) {
        return msg.entry[0].messaging[0].sender.id;
    }
}

function extractPayload(msg) {
    if (msgingZeroExists(msg) && !!msg.entry[0].messaging[0].postback) {
        return msg.entry[0].messaging[0].postback.payload;
    }
    return false;
}

function msgingZeroExists(msg) {
    return !!msg && !!msg.entry && !!msg.entry[0] && !!msg.entry[0].messaging
        && !!msg.entry[0].messaging[0];
}

// Get user info from Facebook
const _getUserInfo = (id) => {
    let options = {
        host: 'graph.facebook.com',
        port: 443,
        path: `/${id}?fields=first_name,last_name,timezone&access_token=${FB_ACCESS_TOKEN}`,
        method: 'GET'
    };

    return _makeHttpCall(options);
};

function getUserInfo(fbId) {
    return _getUserInfo(fbId).then(user_info => {
        user_info["tz"] = parseFloat(user_info["timezone"]);
        delete user_info["timezone"];
        let user = user_info;
        user["timezone"] = dateutils.getTimezoneNameFromOffset(user.tz);
        return user;
    });
}

module.exports = {
    getUserInfo: getUserInfo,
    sendFBTextMessage: sendFBTextMessage,
    sendFBTextMessageWithCards: sendFBTextMessageWithCards,
    sendFBTextMessageWithRealCards: sendFBTextMessageWithRealCards,
    extractText: extractText,
    extractfbId: extractfbId,
    extractPayload: extractPayload,
};