
### Bot
* [Reminder Bot](http://t.me/yastabot)

![Screenshot](https://i.imgur.com/xvkvpqs.png)


### Setup


* Create a bot with the BotFather
* (optional) Create a [papertrail](https://papertrailapp.com/dashboard) account
* create a `config.json` file with the following properties: (papertrail is optional, if its not there it will just log to stdout)

```
{
    "production": {
        "botToken": "<value>",
        "papertrail": {
            "host": "<value>",
            "port": "<value>"
        },
        "username": "<bot username>",
        "googleMapsClientKey": "<value>",
        "port": "<http port>",
        "usersFileName": "filePath.json"
    },
    "development": {
        ....
    }
}
```

* run `npm install`

### Start
`./startbot.sh prod`

### Start development
`./startbot.sh dev`

### Contributing
* Install the pre-commit githook: `cp githooks/pre-commit .git/hooks/`
* Feel free to submit issues and pull requests!