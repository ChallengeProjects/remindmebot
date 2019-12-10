// goal of this script is to enable the flipping the order of the reminder
// so both of these strings should work:
// let s1 = "/remindme [at 5 pm] that i will need to leave at 6 pm";
// let s2 = "/remindme that i will need to leave at 6 pm [at 5 pm]";
//--------------
// problems with this algorithm
// 1- doesnt include alot of the keywords for date time:
//  * every
//  * tomorrow
//  * next [week/month/year]
//  * in [0-9] [second/minute/hour/..]
// 2- if i included all of these terms, what would happen when the user says: "remind me that i need to sleep early for tomorrow at 3 pm"
//      - is it "tomorrow at 3 pm" or "at 3 pm"?

function getAllIndices(arr, val) {
    var indexes = [],
        i;
    for (i = 0; i < arr.length; i++)
        if (arr[i].toLowerCase() === val.toLowerCase())
            indexes.push(i);
    return indexes;
}


function splitReminderTextAndDateTime(s) {
    let sArr = s.split(" ");
    const REMINDER_TEXT_DELIMITERS = ["to", "that"];
    const REMINDER_DATE_TIME_DELIMITERS = ["on", "at", "in"];
    let reminderTextDelimitersIndices = [];
    let reminderDateTimeDelimitersIndices = [];
    for (let reminderTextDelimiter of REMINDER_TEXT_DELIMITERS) {
        reminderTextDelimitersIndices.push(...getAllIndices(sArr, reminderTextDelimiter));
    }
    for (let reminderDateTimeDelimiter of REMINDER_DATE_TIME_DELIMITERS) {
        reminderDateTimeDelimitersIndices.push(...getAllIndices(sArr, reminderDateTimeDelimiter));
    }
    reminderTextDelimitersIndices.sort((a, b) => a - b);
    reminderDateTimeDelimitersIndices.sort((a, b) => a - b);
    if (reminderDateTimeDelimitersIndices.length == 0 || reminderTextDelimitersIndices.length == 0) {
        throw 'Could not parse';
    }

    let reminderText = "";
    let reminderDateTimeText = "";

    // /remindme (on|at) .... (to|that) ...
    // then i want the first (on|at) in the string and the first (to|that)
    if (reminderDateTimeDelimitersIndices[0] < reminderTextDelimitersIndices[0]) {
        reminderDateTimeText = sArr.slice(reminderDateTimeDelimitersIndices[0], reminderTextDelimitersIndices[0]).join(" ");
        reminderText = sArr.slice(reminderTextDelimitersIndices[0]).join(" ");
    }
    // /remindme (to|that) ... (on|at) ...
    // then i want the first (to|that) in the string and the last (on|at)
    else {
        reminderText = sArr.slice(reminderTextDelimitersIndices[0], reminderDateTimeDelimitersIndices.slice(-1)[0]).join(" ");
        reminderDateTimeText = sArr.slice(reminderDateTimeDelimitersIndices.slice(-1)[0]).join(" ");
    }

    return {
        reminderText: reminderText.trim(),
        reminderDateTimeText: reminderDateTimeText.trim()
    };
}

let tests = ["/remindme at 5 pm that i will need to leave at 6 pm",
    "/remindme that i will need to leave at 6 pm at 5 pm",
    "/r to https://drive.google.com/open?id=1Sv-U_ik1iSzFgJ0AhgdV8EWzZD905G-A in two hours",
    "/remindme to reach out to Shanae and Monique tomorrow at noon",
    "/remindme to turn in thing slip at 3:05 pm",
    "/remindme to reach out to tasha and Alejandra on the 30th of April",
    "/r to add anups script to workflow at 8",
    "/remindme to text grandma in 30 minutes",
    "/remindme to get passport info at 6pm",
    "/r to wake austin up at 630 am on may 14",
    "/remindme to wake up austin at 6:30 am on may 14"
];
for (let s of tests) {
    console.log(splitReminderTextAndDateTime(s));
}

module.exports = {
    splitReminderTextAndDateTime: splitReminderTextAndDateTime,
};