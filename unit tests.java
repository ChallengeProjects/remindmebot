processTime:
    _splitReminderText:
        /remindme every day at 3 pm to sdfkjaskjfa
        /remindme every day at 3 pm that sdfkjaskjfa
        /remindme askdfjaskfjdkaj that aksjdfaksjf
        /remindme akjdfkasj that asdf a f that to adfas aksdjfas
    _getTimePartFromString
        /remindme every day at 3 am, 2 pm
        /remindme on monday at 3am and 2 pm
    _getDatePartFromString
        /remindme askdfjaksfja at 3 am , 2 pm
    _getTimesFromString
        /remindme every day at 3 am, 2 pm
        /remindme on monday at 3am and 2 pm
        /remindme on tuesday at 3,4,5 pm , 7 am
    _getDateFromOrdinal
        /remindme on august 3rd at 3 pm to asdfas
        /remindme on the 4th at 3 pm to asdfas
        /remindme on august the 3rd at 4 am
    _parseCustomDateFormats
        /remindme on august 3rd at 3 pm to asdfas
        /remindme on the 4th at 3 pm to asdfas
        /remindme on august the 3rd at 4 am
    _parseRecurringDates
        /remindme every day at 3 am, 4 pm
        /remindme every monday at 3 pm, 4 am
        /remindme every 2 days at 3 am, 4 am
    correctSpellingForDateTimeText
        /remindme in 3 mintues
        /remindme in 4 hors
    getDate
        combinations of all the above