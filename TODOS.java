TODOS:
----------------------
[Sorted By Priority]
* suggest autofix text before time
* [2 hours] fix the bot restart problem with "every month" ("problem2")
* use this to reply to my own message when user snoozes: ctx.reply(message, extra.inReplyTo(message.message_id))
------------------
* i dont like how getTimePartsFromString() is implemented, cant thing of a case that would break it now but pretty sure there is one
* sed command to edit texts
* remind me on tuesdayS and wednesdayS at .. to ...
* alfred response should not have html entities, callback should just scrape it out
* attach images to reminders
* plot a graph of all reminders times
* refactor code so encoding of text is either in reminder.js or outside
* remind me first weekend after 04/17 to ..
    * remind me on the weekend in 2 weeks to..
* [1 hour] remindme every 2 saturdays OR every 2 weeks starting saturday
* [1 hour] remindme every 1st of month
    * note: you also need to process ordinal strings like "first"
* [1 hour] add random reminder /remindme every [3-7] hours
    * random flag and parameters (i guess range in this case)
    * callback function that sends the message generates the next one based on the range
* clean up the mess i made from the server commit, the response function should be abstracted
    * one function to respond to bot
    * one function to respond to alfred
        * that function should filter out the html tags out
    * every bot -> callback should be split to bot -> callback that calls another callback, the wrapper callback would pass the correct reply function
--------
LOW PRIORITY [in order]:
* remind me tomorrow at 3 pm and every tuesday at 4 pm to ... [mix recurring and non recurring reminders]
* Integration with calendar
    * on the same day it would ask me if i want to delay my reminders after my calendar events, and by how long
* dashboard:
    * parse the log file and draw charts for how often people are:
        * setting reminders (non recurring vs recurring)
        * setting invalid reminders
        * /start
    * setup autorotation for the log file so it doesnt max out
UX DESIGN PROBLEMS:
    * autocorrect on list search
    * /remindme to.. at..
    * /remindme to..
        * when do you want to be reminded?
* only allow admin to use reminder bot in a group
* remind me when im home -> sync with calendar
* [20 minutes] bot said i dont have any reminders, if i dont have any it should show the recurring ones
    * or think of a better way in general to list them all, what if i only had a couple of non recurring reminders
        * then I can either show the recurring ones in the same message or in a different one?
* setup server instead of polling for bot so its faster (add an option in config to do that)
* [1 hour] alfred workflow for list reminder bot
    * list all when user does typeahead search
    * selection allows user to
        * view the whole text
        * edit time
        * edit text
        * append
* [1 hour] reminder list
    - how to make a list reminder:
    - when shown/edited, show these options
        - add
        - remove
        - clear
        - change title
* pagination: show << page 1,2,3,4,5 >>
* [20 minutes] option to edit time for recurring reminders
* franco arabic: fakarny kaman sa3ten, fakarny youm el etnen, fakarny kol esbo3, fakarny kol esbo3en, fakarny kol youmen
* /rate goes to storebot
* donate
-----
big effort:
* mac app for remindmebot
* sync events with google/ios calendar
* messenger bot
-----
non features:
* setup papertrail alerts on all errors
* unit tests
    * parsing
    * setTimeout reminders
* move the edit stuff in another module, refactor everything
* middleware that runs before every call to check if user exists, if not it creates it
* docker for the whole thing
* install redis or memcached
-----
list - list all reminders
remindme - add a reminder
timezone - set your timezone
help - how to use this bot
about - about this bot
-----------------------------------
Alfred workflow:
    First time Alfred:
        Ask to write username
        Send to bot the username
        
    Bot send to telegram token
    Alfred asks for token
    Alfred sends bot token and confirms that its correct
    Bot gets new token from telegram to encrypt all messages
    -----
    Alfred sends /remind me to bot, gets confirmation or error message from bot and displays it
    -------
    Alfred sends /list
    Lists inline
    Choose to view then u get the option to edit
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

problem2: in 2 weeks, will get recalculated if i close and open it again

problem2:
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