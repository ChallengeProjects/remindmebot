forever &> /dev/null
if [[ $? != 0 ]]; then
    echo "you need to install forever first"
fi
forever list | egrep remindmebot &> /dev/null
if [[ $? == 0 ]]; then
    forever stop "remindmebot" &> /dev/null
fi

forever start --minUptime 2000 --spinSleepTime 3000 -a --uid "remindmebot" -c "npm start" .