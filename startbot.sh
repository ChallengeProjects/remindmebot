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
forever &> /dev/null
if [[ $? != 0 ]]; then
    echo "you need to npm install first"
fi
forever list | egrep $uid &> /dev/null
if [[ $? == 0 ]]; then
    forever stop "$uid" &> /dev/null
fi

if [[ $prod == "true" ]]; then
    forever start --minUptime 2000 --spinSleepTime 3000 -a --uid "$uid" -c "npm start" .
else
    # only watch in dev environment
    forever start -w --minUptime 2000 --spinSleepTime 3000 -a --uid "$uid" -c "npm run startdev" .
fi    
