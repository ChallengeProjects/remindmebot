#!/bin/bash


environment=$1
platform=$2

if [[ $environment == "prod" || $environment == "production" ]]; then
    uid="remindmebotprod"
    NODE_ENV="production"
elif [[ $environment == "test" || $environment == "beta" || $environment == "dev" || $environment == "development" ]]; then
    uid="remindmebotbeta"
    NODE_ENV="development"
else
    echo "provide prod or beta for environment (i.e ./startbot.sh test telegram)"
    exit 1
fi

if [[ $platform == "telegram" ]]; then
    uid="${uid}_telegram"
    config="config.json"
elif [[ $platform == "messenger" || $platform == "msgr" ]]; then
    uid="${uid}_messenger"
    config="msgrconfig.json"
else
    echo "please provide 'telegram' or 'messenger' (i.e ./startbot.sh test telegram)"
    exit 1
fi

# quit if eslint fails
npm run eslint
if [[ $? != 0 ]]; then
    echo "eslint failed, startbot.sh exiting..."
    exit 1
fi

alias forever="./node_modules/forever/bin/forever"
shopt -s expand_aliases
forever &> /dev/null
if [[ $? != 0 ]]; then
    echo "you need to npm install first"
fi
forever list | egrep $uid &> /dev/null
if [[ $? == 0 ]]; then
    echo "stopping the forever process"
    forever stop "$uid" &> /dev/null
fi

echo "starting the forever process"
NODE_ENV="${NODE_ENV}" config="$config" forever start "forever/${NODE_ENV}_${platform}.json" --minUptime 2000 --spinSleepTime 3000