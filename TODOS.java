TODOS: 
Add an "FN" button ("Friday Night"), only show it when it''s me
----------------------
[Sorted By Priority]
* unit tests:
    * parseNonRecurringSingleDate:
        * _fixImpliedMeridiemOfChronoResult
        * _isMeridiemImplied
        * parseNonRecurringSingleDate: * unit tests for english and italian for parseNonRecurringSingleDate ["tra 10 minuti" ,"tra 1 ora" ,"tra tre minuti" ,"alle 10" ,"il 23 di Marzo" ,"alle 2 di pomeriggio" ,"domani alle 5 di pomeriggio" ,"tra 5 minuti" ,"mercoledì" ,"il 5 Gennaio"]
        * _fixDatesInThePast
        * _parseCustomDateFormats
    * move timemachine to "lib" directory and write tests for it
    * parseRecurringDates
        * _convertEndingDateTimeTextToReminderDateTimeText
        * _getEndingDateTime
        * _getRecurringDates
    * utils: [low priority]
        * regexMatchDateTextOrdinal
        * matchEverything
* BUG: /timezone (https://www.npmjs.com/package/js-levenshtein)
    /timezone kajdkfajs actually worked, shouldnt have worked
    * use the same thing for autocorrecting date/time (see autocorrect branch)
* /list inline query typeahead search thru reminders
* /remindme in 1.25 hours
* BUG: "/r every second to bam bam"
* BUG: "🔄⏱ this should only run at 3:36 pm and 3:36 am" is now being sent at 2:47 am, 2:47 pm
* [1 hour] remindme every 2 saturdays OR every 2 weeks starting saturday
* [1 hour] remindme every 1st of month
    * note: you also need to process ordinal strings like "first" (solution for this wouold be to )
* setup server instead of polling for bot so its faster (add an option in config to do that)
    * navigating menus is affected by this
------------------
* Make an actual walkthrough tutorial (see research/tutorial.java)
* make a gif as a tutorial to be sent with /help or /start show my bot working on all different types of reminders on alfred
    * see research/gif.java
* user studies
* suggest autofix text before time
    * send message "Did you mean?", with "Yes", "No" buttons
    * save reminder in user temp storage, "Yes" button will 
* auto search preset reminders
    * user types "@bot snug" and bot will display command: "/r charge snugphones at 8 pm"
    * user taps, bam, reminder set
* better way to output recurring reminders
    * that shouldnt be hard, just output the text we got from the user
* remind me on tuesdayS and wednesdayS at .. to ...
* use this to reply to my own message when user snoozes: ctx.reply(message, extra.inReplyTo(message.message_id))
    * Need to store my own message_id somewhere first: https://github.com/telegraf/telegraf/issues/154
* Delete -> undo
* make a specific help message for the bot when its a group chat to clarify that the user doesnt need to run the command /list@chemistrybot instead just do /list
    * can the bot detect when it has been added to the group and send a message automatically? https://stackoverflow.com/questions/52271498/can-i-detect-my-bots-groups-with-telegram-bot-api
* refactoring:
    * `isOnRequired` variable in the `regexMatchDateTextOrdinal` function is a hack.
        * We need it because when we parse multiple dates we dont always have the `on` (example: on june the 2nd, april the 1st)
        * solution: propogate "on" or "every" down and get rid of the isOnRequired variable
        * (probably do this one later) if user says: "on june the 1st and the 2nd" we need to distribute "june" on both dates too
    * should  getDateToParsedTimesFromReminderDateTime and  getDateToTimePartsMapFromReminderDateTimeText be the same method
    * processTime.getDate shouldnt have the cross product logic
* ITALIAN:
    * choose language from the beginning to show the right welcome message
        * show keyboard buttons
        * store in settings
    * bot should to reply in italian too if the user chose italian in settings
        * shouldnt be hard at all, just make a map per language, get user language from settings
* /list will list all buttons with dates
    * recurring reminders doesnt show up there, a button to switch to normal recurring reminders
        * or should it show up there?
* 2 users requested: * only allow admin to use reminder bot in a group
* 1 user requested: * /appendtoreminder <reminder search text> (to|:) ....
--------
LOW PRIORITY:
* To: "en/eny/eno/enena/enaha/enohom" split for arabic
* multireminder set should just be one remidner and not multiple reminders
* attach images to reminders
* sed command to edit texts
* remind me first weekend after 04/17 to ..
    * remind me on the weekend in 2 weeks to..
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
UX DESIGN PROBLEMS:
    * autocorrect on list search
    * /remindme to.. at..
    * /remindme to..
        * when do you want to be reminded?
* bot said i dont have any reminders, if i dont have any it should show the recurring ones
    * or think of a better way in general to list them all, what if i only had a couple of non recurring reminders
        * then I can either show the recurring ones in the same message or in a different one?
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
* docker for the whole thing
* install redis or memcached
-----
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
