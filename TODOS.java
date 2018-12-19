TODOS:
----------------------
1- fix the bot restart problem with "in 1 month" "second problem"
2- [easy] set end for reminder, /remindme every 2 hours until 10 pm
3- add random reminder /remindme every [3-7] hours
4- bug fel bot: remindme on 01/01 3amalha 2018
5- search the "search" channel "getAutoTimezone" w 7otaha fel bot 3ndy 3shan el user yb3t el location
6- [easy] take text -> ask when u want to be reminded
--------
LATER:
* process ordinals in recurring reminders (also strings "first" "second")
* use google maps for location for timezone
* unit tests just for parsing
* include in README the telegram link for the bot and a screenshot
* move the edit stuff in another module, refactor everything
* middleware that runs before every call to check if user exists, if not it creates it
* send message wrapper if bot blocked me i should delete them
* sync events with my google/ios calendar
* unit tests for everything else other than parsing
* tre2a a3ml beiha zorar a2ol feih im leaving, aw ana raye7 davis aw ana fe target, wa7ot lists lel 7agat dih
* franco: fakarny kaman sa3ten, fakarny youm el etnen, fakarny kol esbo3, fakarny kol esbo3en, fakarny kol youmen
* make it a messenger bot
* make mac app for remindmebot
* /rate yro7 3l storebot
* alfred workflow
* donate
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