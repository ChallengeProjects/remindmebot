1- processTime: keyword is "every"
    parse recurring dates function()
        1- week days "monday, tuesday" -> ["on monday", "on tuesday"]
        2- ordinals 1st 2nd 3rd 24th..., first second third last
        3- "day" -> "in 1 day"|||"hour" -> "in 1 hour"|| "week" -> "in 1 week"
    return [date] x [time]
2- handle serialization/deserialization
3- handle setting timeout
    1- loop over them see which is closest then use that

4- disable reminder: cleartimeout
    enable reminder: settimeout
----
later:
2- frequency:
    "every 2" = "every other"
    every 2 days
    every 2 mondays, tuesdays
    every other 3rd of month