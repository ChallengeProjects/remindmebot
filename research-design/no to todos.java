BUGS DUE TO PREFIX/SUFFIX SYNTAX:
    "this" should be followed by "day/week/month/year"
    "a" should be followed by "second/minute/hour/day/week/month/year"
    "and" should be prefixed and suffixed with anything
    "until" should be followed by smth
    "/remindme on the 18th a5od korty w daftar el shekat"
    '/r in two hours this bot is great!' ---> "this" is in time
BUG DUE TO INCORRECT TIME FORMAT (23451 is obviously not a time):
    /r on monday 23451 is the reference number
        SHOULD BE ["on monday", "23451 is the reference number"]
        UNDERSTANDS ["on monday 23451", "is the reference number"]
KNOWN BUGS:
    '/r in 1 hour 1- geb el boomerang'
    "/remindme on Thursday tomorrow is payday"
    '/r every 50 days 600 miles maintenance time see service manual'
    '/r in 50 days 600 miles maintenance time see service manual'
    '/r at 5 june bus pass'
    /r in 2 weeks 2 weeks have passed
        SHOULD BE ["in 2 weeks", "2 weeks have passed"]
        UNDERSTANDS ["in 2 weeks 2 weeks", "have passed"]
