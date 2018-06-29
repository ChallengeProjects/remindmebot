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
        }
    },
    "development": {
        "botToken": "<value>",
        "papertrail": {
            "host": "<value>",
            "port": "<value>"
        }
    }
}
```

* run `npm install`

### Start
`./startbot.sh`

### Start development
`./startbot.sh dev`