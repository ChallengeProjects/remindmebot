TODOS:
----------------------
0- use this to reply to my own message when user snoozes or deletes: ctx.reply(message, extra.inReplyTo(message.message_id))
1- [20 minutes] option to edit time for recurring reminders
2- [1 hour] reminder list
    - how to make a list reminder:
    - when shown/edited, show these options
        - add
        - remove
        - clear
        - change title
1- [2 hours] fix the bot restart problem with "in 1 month" "second problem"
2- [15 minutes] take text -> ask when u want to be reminded
3- [1 hour] make the "," work even when its a non recurring reminder, example: /remindme at 01/08/2019 at 12 pm,01/014/2019 at 1 pm,01/015/2019 at 8 am to check the "doctor" channel
4- [1 hour] set end for reminder, /remindme every 2 hours until 10 pm
5- [1 hour] add random reminder /remindme every [3-7] hours
6- [30 minutes] bug: remindme on 01/01 3amalha 2018
--------
LOW PRIORITY [in order]:
* alfred workflow
    * authenticate with the telegram bot, obtain a token from the bot server
    * workflow would just forward the message as it is to the bot
* process ordinals in recurring reminders ("1st", "2nd", "third"), find some library to parse it to a number
* pagination: show << page 1,2,3,4,5 >>
* unit tests
    * parsing
    * setTimeout reminders
* move the edit stuff in another module, refactor everything
* middleware that runs before every call to check if user exists, if not it creates it
* send message wrapper if bot blocked me i should delete them
* franco arabic: fakarny kaman sa3ten, fakarny youm el etnen, fakarny kol esbo3, fakarny kol esbo3en, fakarny kol youmen
* messenger bot
* /rate yro7 3l storebot
* mac app for remindmebot
* donate
* docker for the whole thing
* install redis or memcached
* sync events with google/ios calendar
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