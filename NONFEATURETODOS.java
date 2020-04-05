* unit tests for date.js

* clean up the mess i made from the server commit, the response function should be abstracted
    * one function to respond to bot
    * one function to respond to alfred
    * every bot -> callback should be split to bot -> callback that calls another callback, the wrapper callback would pass the correct reply function

* refactoring:
    * `isOnRequired` variable in the `regexMatchDateTextOrdinal` function is a hack.
        * We need it because when we parse multiple dates we dont always have the `on` (example: on june the 2nd, april the 1st)
        * solution: propogate "on" or "every" down and get rid of the isOnRequired variable
        * (probably do this one later) if user says: "on june the 1st and the 2nd" we need to distribute "june" on both dates too
    * should getDateToParsedTimesFromReminderDateTime and  getDateToTimePartsMapFromReminderDateTimeText be the same method?
    * processTime.getDate shouldnt have the cross product logic
        * refactor date x time cross product logic somewhere

retention metrics for reminder bot, parse all from the file

* if NLP takes "/r to test", it just returns an empty list when it should throw an error
    * rather than throwing the error outside

* add ability to configure timezone for timemachine.js
  * this is important since timemachine.js utilizes the time zone of the machine its currently on.
    due to this, we currently assume in our tests that machine times are in the PST time zone. later on if our developers or CI/CD
    machines are running in different time zones, this may cause our unit tests to fail in an unreliable manner.

* unit tests:
    HIGH PRIORITY:
        * unit test:
            /r at 7 to t
            when its 12 pm
        * parseNonRecurringSingleDate:
            * add further test coverage of `_fixDatesInThePast`. there are numerous combinations of known and implied values and dates which should also be tested.
    LOW PRIORITY:
        * move timemachine to "lib" directory and write tests for it
        * parseRecurringDates
            * _convertEndingDateTimeTextToReminderDateTimeText
            * _getEndingDateTime
        * utils:
            * matchEverything

* setup server instead of polling for bot so its faster (add an option in config to do that)
    * navigating menus is affected by this
* UXR studies (right after i do the tutorial)