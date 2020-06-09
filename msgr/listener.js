const https = require("https"),
    fs = require("fs"),
    express = require('express'),
    bodyParser = require('body-parser'),
    handler = require("./handler.js"),
    botutils = require("./botutils.js"),
    UserManager = require("../userManager.js"),
    app = express();

app.use(bodyParser.json({ limit: '50mb' }));

app.post('/webhook', function(req, res) {
    try {
        console.log(JSON.stringify(req.body));
        let p = handler.handle(req.body);
        new Promise(resolve => resolve(p)).then(ret => {
            res.send(ret);
        });
    } catch (err) {
        res.send({});
    }
});

app.get('/webhook', function(req, res) {
    console.log(req.query);
    res.send(req.query['hub.challenge']);
});

app.listen(4444, function() {});

const options = {
    key: fs.readFileSync("/home/buba/test/remindmebot/my-site-key.pem"),
    cert: fs.readFileSync("/home/buba/test/remindmebot/chain.pem"),
};

https.createServer(options, app).listen(4848);
UserManager.loadUsersDataFromStorage(botutils.reminderCallback);