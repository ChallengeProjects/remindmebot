TODOS:
0- fix the bug i have down there "second problem"
1- dont show the list of times, just show the next time
2- 7war skeddy, pagination and switch view
3- split by: recurring and hide disabled with an option to toggle
4- process ordinals in recurring reminders (also strings "first" "second")
5- add my bot in the channel
6- sync with google calendar
--------
LATER:

* unit tests
* use google maps for location
* make it a messenger bot
* include in README the telegram link for the bot and a screenshot
* move the edit stuff in another module, refactor everything
* middleware that runs before every call to check if user exists, if not it creates it
* make mac app for remindmebot
-----
* /rate yro7 3l storebot
* alfred workflow
* donate
* sync events with my google/ios calendar
* docker for the whole thing
* install redis or memcached
-----
list - list all reminders
remindme - add a reminder
timezone - set your timezone
help - how to use this bot
about - about this bot
-----------------------------------
function setTimeout() {
    let timesStrings = reminderDate.getAllMilliseconds();
    for(timeString of timesStrings){ 
        this.setTimeoutString(timeString)
    }
}

function setTimeoutString(timeString) {
    setTimeout(() => {
        pingUser();
        this.setTimeoutString(timeString);
    }, processTime(timeString));
}

2 problems:
    1- bug: ["in 1 day at 9 am", "in 1 day at 9 pm"] will always go to 9 am
    2- in 2 weeks, will get recalculated if i close and open it again


first problem:
    calculated all times in the beginning, recalculate each time after its calculated, keep them sorted

    ["in 1 day at 9 am", "in 1 day at 9 pm"]
    90,130
    ["on monday at 3 pm", "on monday at 4 pm", "on tuesday at 3 pm"]
    30,40,150
    40,150,1230

second problem:
    at 9:00 pm:
        user made reminder: "in 2 hours"
        code:
            time = processTime("in 2 hours")
            setTimeout(() => {
                pingUser();
                clearFromStorage(time);
            }, time);
            store(time)

    at 11:23 pm
    on startup:
        for every time in storage: // time is 10 pm
                if non recurring:
                    if time > now:
                        setTimeout(time)
                    if time < now:
                        send msg
                if recurring:
                    if time > now:
                        setTimeout(time)
                    if time < now:
                        send msg
                        if it starts with "in":
                            diff = now() - processTime(dateString)
                            time + diff + diff ... until its after now
                        else:
                            nothing