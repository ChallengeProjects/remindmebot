* /r morning/noon/afternoon/evening/tonight
    * /r tomorrow morning/evening
/r in the morning
/r at 3 am in the morning
/r at 3 in the
remind me [Tuesday morning] at [10am]
remind me [[in the morning], [on tuesday]] at [10am]
remind me on tuesday wednesday at 10 am

{
    tuesday:
        morning
    wednesday:


}
--------
remind me tonight and tomorrow at 8 pm
[at 8 pm], [in 1 day] -> at 8 pm
------
march 3 -> [MONTH(march), NUMBER(3)] -> [NLPDate(03/03)]
next week -> [next, UNIT(week)] -> [NLPINTERVAL(1, week)]
in a week -> [UNIT_PREFIX(in), PREFIX(a), UNIT(week)] -> [NLPINTERVAL(1, week)]
on sunday -> [DATE_PREFIX(on), sunday] -> [NLPINTERVAL(1, sunday)]
in 5 minutes -> [UNIT_PREFIX(in), 5, minutes] -> [NLPINTERVAL(5, minute)]
on january 5th -> [DATE_PREFIX(on), MONTH(january), ORDINAL(5th)] -> [NLPDate(01/05)]
tuesday morning -> [UNIT(tuesday), TIME(morning)]
in the morning on tuesday [UNIT_PREFIX(in), PREFIX(the), TIME(morning), DATE_PREFIX(on), UNIT(tuesday)]
tomorrow morning -> [tomorrow, morning] -> NLPContainer(NLPINTERVAL(1,day), NLPTime(9, am))
tomorrow -> [tomorrow] -> [NLPINTERVAL(1, day)]
next week on friday -> [next, UNIT(week), on, friday]
march 5th 6th -> [[MONTH(march), ORDINAL(5), ORDINAL(6)]]
march 5th and 6th -> [[MONTH(march), ORDINAL(5)], [ORDINAL(6)]]
march 5th and 6th of june -> [[MONTH(march), ORDINAL(5)], [MONTH(june), ORDINAL(6)]]

TIME:
    MORNING/NOON/AFTERNOON/EVENING/TONIGHT
MONTH()
NUMBER()
ORDINAL()
UNIT:
    WEEKDAY
    OTHER {s,m,h,d,w,M,y}
merging:
    TIME, [NUMBER|ORDINAL], MONTH
    TIME, [ORDINAL]
    TIME, NUMBER, UNIT (as long as unit is not time)
    TIME, NUMBER, UNIT, UNIT (if one unit is "week" and the other is WEEKDAY)
splitting:
    and
    ,
recombining with last one:
    [[TIME?, [NUMBER|ORDINAL], MONTH], [NUMBER|ORDINAL]] -> [[TIME?, [NUMBER|ORDINAL] + [NUMBER|ORDINAL], MONTH]]
-----
split on "and", if morning,afternoon,tonight were found