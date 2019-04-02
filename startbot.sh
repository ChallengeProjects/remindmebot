#!/bin/bash


environment=$1

if [[ $environment == "prod" || $environment == "production" ]]; then
    prod="true"
    uid="remindmebotprod"
    NODE_ENV="production"
elif [[ $environment == "test" || $environment == "beta" || $environment == "dev" || $environment == "development" ]]; then
    prod="false"
    uid="remindmebotbeta"
    NODE_ENV="development"
else
    echo "provide prod or beta for environment"
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
if [[ $prod == "true" ]]; then
    NODE_ENV=production forever start production.json --minUptime 2000 --spinSleepTime 3000
else
    # only watch in dev environment
    NODE_ENV=development forever start development.json --minUptime 2000 --spinSleepTime 3000
fi    
