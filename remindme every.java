/remindme every https://developer.apple.com/library/archive/documentation/DataManagement/Conceptual/EventKitProgGuide/CreatingRecurringEvents/CreatingRecurringEvents.html
    type: daily, weekly, monthly
    frequency: 1 (every 1), 2 (every 2)
    option to disable everytime its there
    3.1- sunday,monday,tuesday at 3 pm, 4pm
    3.2- every month 1,2,3,$ at 3 pm

if str.includes("every") {
    reminderDateTimeText = "every sunday,monday at 3 pm";
    date = processTime(reminderDateTimeText);
    setTimeout(() => {
        remindUser("test");
        next sunday at 3 pm
    }, date)
}

[sunday,monday] at [2 pm]
sunday at 2 pm
monday at 2 pm
[sunday,monday] at [2,3] pm
sunday at 2 pm
sunday at 3 pm
monday at 2 pm
monday at 3 pm
[sunday,monday] at [2 pm, 3 pm]


enable/disable reminders