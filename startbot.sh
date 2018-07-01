#!/bin/bash

# quit if eslint fails
npm run eslint
if [[ $? != 0 ]]; then
    echo "eslint failed, startbot.sh exiting..."
    exit 1
fi

environment=$1

prod="false"
uid="remindmebotbeta"
NODE_ENV="development"
if [[ $environment == "" || $environment == "prod" || $environment == "production" ]]; then
    prod="true"
    uid="remindmebotprod"
    NODE_ENV="production"
fi

alias forever="./node_modules/forever/bin/forever"
shopt -s expand_aliases
forever &> /dev/null
if [[ $? != 0 ]]; then
    echo "you need to npm install first"
fi
forever list | egrep $uid &> /dev/null
if [[ $? == 0 ]]; then
    forever stop "$uid" &> /dev/null
fi

if [[ $prod == "true" ]]; then
    NODE_ENV=production forever start production.json --minUptime 2000 --spinSleepTime 3000
else
    # only watch in dev environment
    NODE_ENV=development forever start development.json --minUptime 2000 --spinSleepTime 3000
fi    
