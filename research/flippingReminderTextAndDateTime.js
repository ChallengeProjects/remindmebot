// goal of this script is to enable the flipping the order of the reminder
// so both of these strings should work:
// let s1 = "/remindme [at 4 pm] that i will need to leave at 5 pm";
// let s2 = "/remindme that i need to leave at 4 pm at 5 pm";
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
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i].toLowerCase() === val.toLowerCase())
            indexes.push(i);
    return indexes;
}


function splitReminderTextAndDateTime(s) {
    let sArr = s.split(" ");
    const REMINDER_TEXT_DELIMITERS = ["to", "that"];
    const REMINDER_DATE_TIME_DELIMITERS = ["on", "at"];
    let reminderTextDelimitersIndices = [];
    let reminderDateTimeDelimitersIndices = [];
    for(let reminderTextDelimiter of REMINDER_TEXT_DELIMITERS) {
        reminderTextDelimitersIndices.push(...getAllIndices(sArr, reminderTextDelimiter));
    }
    for(let reminderDateTimeDelimiter of REMINDER_DATE_TIME_DELIMITERS) {
        reminderDateTimeDelimitersIndices.push(...getAllIndices(sArr, reminderDateTimeDelimiter));
    }
    reminderTextDelimitersIndices.sort((a, b) => a-b);
    reminderDateTimeDelimitersIndices.sort((a, b) => a-b);
    if(reminderDateTimeDelimitersIndices.length == 0 || reminderTextDelimitersIndices.length == 0) {
        throw 'Could not parse';
    }

    let reminderText = "";
    let reminderDateTime = "";

    // /remindme (on|at) .... (to|that) ...
    // then i want the first (on|at) in the string and the first (to|that)
    if(reminderDateTimeDelimitersIndices[0] < reminderTextDelimitersIndices[0]) {
        reminderDateTime = sArr.slice(reminderDateTimeDelimitersIndices[0], reminderTextDelimitersIndices[0]).join(" ");
        reminderText = sArr.slice(reminderTextDelimitersIndices[0]).join(" ");
    }
    // /remindme (to|that) ... (on|at) ...
    // then i want the first (to|that) in the string and the last (on|at)
    else {
        reminderText = sArr.slice(reminderTextDelimitersIndices[0], reminderDateTimeDelimitersIndices.slice(-1)[0]).join(" ");
        reminderDateTime = sArr.slice(reminderDateTimeDelimitersIndices.slice(-1)[0]).join(" ");
    }

    console.log(reminderText);
    console.log(reminderDateTime);
}

module.exports = {
    splitReminderTextAndDateTime: splitReminderTextAndDateTime,
};