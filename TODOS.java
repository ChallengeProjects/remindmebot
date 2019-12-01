TODOS: 
----------------------
[Sorted By Priority]
* take care of redundancy:
    * take the more accurate information from the 2:
        * /r on friday the 23rd         [IGNORE "FRIDAY"]   -> /r on the 23rd at 7 pm to ...
        * /r tonight at 8 pm            [IGNORE "TONIGHT"]  -> /r at 8 pm to ...
        * /r tomorrow morning/evening at 11 am  [IGNORE "morning"]  -> /r tomorrow at 11 am
        * /r today at 2 pm              [IGNORE "TODAY"]    -> /r at 2 pm to ...
        * /r next week on friday -> /r in 1 week on friday [/s/1 week/2/]  -> /r in 2 friday to ...
        * /r in 2 weeks on friday       [IGNORE "WEEKS ON"] -> /r in 2 friday to ...
    * but make sure these work:
        * /r on friday
        * /r today (when is today?)
        * /r morning/noon/afternoon/evening/tonight
            * /r tomorrow morning/evening
        * /r next week -> /r in 1 week
        * /r next week on friday -> /r in 2 friday
    * unit tests:
        "/r on friday the 23rd", "/r tonight at 8 pm", "/r tomorrow morning at 11 am", "/r tomorrow evening at 6 pm",
        "/r today at 2 pm", "/r next week on friday", "/r in 2 weeks on friday", "/r today", "/r in the morning",
        "/r in the afternoon", "/r tonight", "/r next week"
* remove need for "to" -> "/r at 8 am text text"
    * this will make it easier to flip the order later
    * should i have a did you mean msg with yes/no buttons?
* "/r to .. at 8 tomorrow"
* unit tests:
    HIGH PRIORITY:
        * parseNonRecurringSingleDate:
            * parseNonRecurringSingleDate
            * _fixDatesInThePast
    LOW PRIORITY:
        * move timemachine to "lib" directory and write tests for it
        * parseRecurringDates
            * _convertEndingDateTimeTextToReminderDateTimeText
            * _getEndingDateTime
        * utils:
            * matchEverything
* /list inline query typeahead search thru reminders
* BUG: "🔄⏱ this should only run at 3:36 pm and 3:36 am" is now being sent at 2:47 am, 2:47 pm
    * when it gets disabled then enabled
* BUG: if NLP takes "/r to test", it just returns an empty list when it should throw an error
* [1 hour] remindme every 1st of month
    * note: you also need to process ordinal strings like "first"
* Remind me 1 week before 09/02
* setup server instead of polling for bot so its faster (add an option in config to do that)
    * navigating menus is affected by this
------------------
* Make an actual walkthrough tutorial (see research/tutorial.java)
* make a gif as a tutorial to be sent with /help or /start show my bot working on all different types of reminders on alfred
    * see research/gif.java
* UXR studies (right after i do the tutorial)
* suggest autofix text before time
    * send message "Did you mean?", with "Yes", "No" buttons
    * save reminder in user temp storage, "Yes" button will 
* auto search preset reminders
    * user types "@bot snug" and bot will display command: "/r charge snugphones at 8 pm"
    * user taps, bam, reminder set
* better way to output recurring reminders
    * that shouldnt be hard, just output the text we got from the user
* use this to reply to my own message when user snoozes: ctx.reply(message, extra.inReplyTo(message.message_id))
    * Need to store my own message_id somewhere first: https://github.com/telegraf/telegraf/issues/154
    * store in the reminder objevt the latest message_id?
* Delete -> undo
* make a specific help message for the bot when its a group chat to clarify that the user doesnt need to run the command /list@chemistrybot instead just do /list
    * can the bot detect when it has been added to the group and send a message automatically? https://stackoverflow.com/questions/52271498/can-i-detect-my-bots-groups-with-telegram-bot-api
* refactoring:
    * `isOnRequired` variable in the `regexMatchDateTextOrdinal` function is a hack.
        * We need it because when we parse multiple dates we dont always have the `on` (example: on june the 2nd, april the 1st)
        * solution: propogate "on" or "every" down and get rid of the isOnRequired variable
        * (probably do this one later) if user says: "on june the 1st and the 2nd" we need to distribute "june" on both dates too
    * should getDateToParsedTimesFromReminderDateTime and  getDateToTimePartsMapFromReminderDateTimeText be the same method?
    * processTime.getDate shouldnt have the cross product logic
        * refactor date x time cross product logic somewhere
--------
LOW PRIORITY:
* /appendtoreminder <reminder search text> (to|:) ....
* /list will list all buttons with dates
    * recurring reminders doesnt show up there, a button to switch to normal recurring reminders
        * or should it show up there?
* 2 users requested: * only allow admin to use reminder bot in a group
* To: "en/eny/eno/enena/enaha/enohom" split for arabic
* multireminder set should just be one remidner and not multiple reminders
* attach images to reminders
* sed command to edit texts
* remind me first weekend after 04/17 to ..
* /download -> download all reminders in json/csv format
* [1 hour] add random reminder /remindme every [3-7] hours
    * random flag and parameters (i guess range in this case)
    * callback function that sends the message generates the next one based on the range
* plot a graph of all reminders times
* remind me tomorrow at 3 pm and every tuesday at 4 pm to ... [mix recurring and non recurring reminders]
* dashboard:
    * parse the log file and draw charts for how often people are:
        * setting reminders (non recurring vs recurring)
        * setting invalid reminders
        * /start
    * setup autorotation for the log file so it doesnt max out
* add ability to configure timezone for timemachine.js
  * this is important since timemachine.js utilizes the time zone of the machine its currently on.
    due to this, we currently assume in our tests that machine times are in the PST time zone. later on if our developers or CI/CD
    machines are running in different time zones, this may cause our unit tests to fail in an unreliable manner.
UX DESIGN PROBLEMS:
    * autocorrect on list search
    * /remindme to.. at..
    * /remindme to..
        * when do you want to be reminded?
* ITALIAN:
    * choose language from the beginning to show the right welcome message
        * show keyboard buttons
        * store in settings
    * bot should to reply in italian too if the user chose italian in settings
        * shouldnt be hard at all, just make a map per language, get user language from settings
* [1 hour] alfred workflow for list reminder bot
    * list all when user does typeahead search
    * selection allows user to
        * view the whole text
        * edit time
        * edit text
        * append
    * clean up the mess i made from the server commit, the response function should be abstracted
        * one function to respond to bot
        * one function to respond to alfred
        * every bot -> callback should be split to bot -> callback that calls another callback, the wrapper callback would pass the correct reply function
* [1 hour] reminder list
    - how to make a list reminder:
    - when shown/edited, show these options
        - add
        - remove
        - clear
        - change title
* pagination: show << page 1,2,3,4,5 >>
* option to edit time for recurring reminders
* /rate goes to storebot
* donate
-----
big effort:
* mac app for remindmebot
* sync events with google/ios calendar
    Add reminders as events to the calendar
        * new command /schedule to add an event
    remind me when im free:
        check couple of hours gap in the calendar?
    remind me when im at a place
        * when im home? see when i finished work
        * when im in sunnyvale? find events that are in sunnyvale
    * on the same day it would ask me if i want to delay my reminders after my calendar events, and by how long
* messenger bot
-----
non features:
* unit tests
    * setTimeout reminders
* move the edit stuff in another module, refactor everything
* middleware that runs before every call to check if user exists, if not it creates it
-----
command list for bot father:
    list - list all reminders
    timezone - set your timezone
    help - how to use this bot
    about - about this bot
    REMOVED: remindme - add a reminder
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
Problems of scale:
    * Im not using a database