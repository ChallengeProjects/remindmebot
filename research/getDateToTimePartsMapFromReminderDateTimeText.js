// // [see tests for examples]
// function getDateToTimePartsMapFromReminderDateTimeText(str) {
//     function _isAtSegmentATimePart(words) {
//         // make sure all "words" in the atSegment only contain "time words"
//         for (let word of words) {
//             // each word has to either be time number or meridiem
//             if (!isTimeNumber(word) && !isMeridiem(word)) {
//                 return false;
//             }
//         }
//         return true;
//     }

//     const WORD_DELIMITERS = ["on", "every", "and", "at"];
//     const NON_WORD_DELIMITERS = [",", "\\."];
//     const DELIMITERS_REGEX = `${WORD_DELIMITERS.map(x => `\\b${x}\\b`).join("|")}|${NON_WORD_DELIMITERS.join("|")}`;

//     function areAllWordsDelimiters(words) {
//         for (let word of words) {
//             if (!word.match(new RegExp(`^(${DELIMITERS_REGEX})$`, 'i'))) {
//                 return false;
//             }
//         }
//         return true;
//     }

//     function cleanupHangingLooseDelimitersInOrder(consecutiveAtSegments) {
//         // merge all strings into one array
//         let oneArray = consecutiveAtSegments.join(" ").split(" ");
//         let i = oneArray.length - 1;
//         while(i >= 0) {
//             if(!areAllWordsDelimiters([oneArray[i]])) {
//                 break;
//             }
//             i--;
//         }
//         // i is the index of the last non-delimiter
//         return {
//             cleanedUpArray: oneArray.slice(0, i+1),
//             hangingLooseDelimiters: oneArray.slice(i+1),
//         };
//     }
//     // "on 2/3 at 2,3,4" -> ["2/3","2","3 "4"]
//     // "every monday at 2 am, 2 pm and 3 pm and tuesday at 4 pm
//     //  -> ["monday", "2 am", "2 pm", "3 pm", "tuesday", " 4 pm"]
//     //  "every monday,tuesday at 2,3 pm" -> ["monday,tuesday", "2 3 pm"]
//     // Now I need to combine the consecutive time parts so it becomes
//     //  dates: ["monday", "tuesday"], times: ["2 am 2 pm 3 pm", " 4 pm"]

//     let atSegments = str
//         // split with \bWORD_DELIMITER\b OR NON_WORD_DELIMITER
//         .split(new RegExp(`(${DELIMITERS_REGEX})`, 'ig'))
//         // .split(new RegExp(`\\b(${["on", "every", "and", "at", ","].join("|")})\\b`, 'ig'))
//         .map(x => x.trim())
//         .filter(x => !!x.length); // make sure no empty string is in the list
//     let timeParts = []; // [consecutiveAtTimeSegment1, consecutiveAtTimeSegment2, ...]
//     let dateParts = []; // [consecutiveAtDateSegment1, consecutiveAtDateSegment2, ...]
//     let consecutiveAtTimeSegments = [];
//     let consecutiveAtDateSegments = [];
//     const DATE_PARTS_DELIMITER = " ";
//     const TIME_PARTS_DELIMITER = " ";

//     let isProcessingDatePart = true;
//     for (let atSegment of atSegments) {
//         let words = _parseTimesStringToArray(atSegment);

//         // If its just a delimiter, 
//         if(areAllWordsDelimiters(words)) {
//             if(isProcessingDatePart) {
//                 consecutiveAtDateSegments.push(atSegment.trim());
//             }
//             // else {
//             //     consecutiveAtTimeSegments.push(atSegment.trim());
//             // }
//             continue;
//         }

//         if (_isAtSegmentATimePart(words)) {
//             isProcessingDatePart = false;
//             if (consecutiveAtDateSegments.length) {
//                 let { cleanedUpArray, hangingLooseDelimiters} = cleanupHangingLooseDelimitersInOrder(consecutiveAtDateSegments);
//                 dateParts.push(cleanedUpArray.join(DATE_PARTS_DELIMITER));
//                 consecutiveAtDateSegments = [];
//                 // consecutiveAtTimeSegments.push(...hangingLooseDelimiters);
//             }
//             consecutiveAtTimeSegments.push(atSegment.trim());
//         }
//         else {
//             isProcessingDatePart = true;
//             if (consecutiveAtTimeSegments.length) {
//                 let { cleanedUpArray, hangingLooseDelimiters} = cleanupHangingLooseDelimitersInOrder(consecutiveAtTimeSegments);
//                 timeParts.push(cleanedUpArray.join(TIME_PARTS_DELIMITER));
//                 consecutiveAtTimeSegments = [];
//                 consecutiveAtDateSegments.push(...hangingLooseDelimiters);
//             }
//             consecutiveAtDateSegments.push(atSegment.trim());
//         }
//     }
//     // Add anything we didnt clear at the end
//     if (consecutiveAtTimeSegments.length) {
//         timeParts.push(consecutiveAtTimeSegments.join(TIME_PARTS_DELIMITER));
//     }
//     if (consecutiveAtDateSegments.length) {
//         dateParts.push(consecutiveAtDateSegments.join(DATE_PARTS_DELIMITER));
//     }

//     // create the map and return
//     let dateToTimeMap = {};
//     for (let i = 0; i < Math.max(timeParts.length, dateParts.length); i++) {
//         if (i == timeParts.length) {
//             dateToTimeMap[dateParts[i]] = [];
//         }
//         else {
//             dateToTimeMap[dateParts[i]] = timeParts[i];
//         }
//     }
//     return dateToTimeMap;
// }



// [see tests for examples]
// function getDateToTimePartsMapFromReminderDateTimeText(str) {
//     str = str.toLowerCase();
//     // const WORD_DELIMITERS = ["on", "every", "at"];
//     // const DELIMITERS_REGEX = `${WORD_DELIMITERS.map(x => `\\b${x}\\b`).join("|")}`;

//     // "on 2/3 at 2,3,4" -> ["2/3","2","3 "4"]
//     // "every monday at 2 am, 2 pm and 3 pm and tuesday at 4 pm
//     //  -> ["monday", "2 am", "2 pm", "3 pm", "tuesday", " 4 pm"]
//     //  "every monday,tuesday at 2,3 pm" -> ["monday,tuesday", "2 3 pm"]
//     // Now I need to combine the consecutive time parts so it becomes
//     //  dates: ["monday", "tuesday"], times: ["2 am 2 pm 3 pm", " 4 pm"]
    
//     // algorithm:
//     //  1- remove any "and" or ","
//     //  2- if you see an "every" or "on" we are at a date part
//     //  3- if you see an "at" we are at a time part
//     //  4- keep adding in consecutiveAt(Time/Date)Segments until you meet a (Date/Time) part then
//     //      push all in (time/date)Parts array

//     let atSegments = str
//         // remove any "and" or ","
//         .replace(/\band\b|,/g, "")
//         // split with /on .* (at|on|every)/  OR  /at .* (at|on|every)/ OR  /every .* (at|on|every)/
//         .split(/(\bon\b.*?(?=\bat\b|\bon\b|\bevery\b|$))|(\bat\b.*?(?=\bat\b|\bon\b|\bevery\b|$))|(\bevery\b.*?(?=\bat\b|\bon\b|\bevery\b|$))/ig)
//         // split with \bWORD_DELIMITER\b OR NON_WORD_DELIMITER
//         // .split(new RegExp(`(${DELIMITERS_REGEX})`, 'g'))
//         .filter(x => !!x) // make sure no undefines are in the list
//         // trim and remove double spaces
//         .map(x => x.trim().replace(/ {1,}/g, " "))
//         .filter(x => !!x.length) // make sure no empty strings are in the list
//     let timeParts = []; // [consecutiveAtTimeSegment1, consecutiveAtTimeSegment2, ...]
//     let dateParts = []; // [consecutiveAtDateSegment1, consecutiveAtDateSegment2, ...]
//     let consecutiveAtTimeSegments = [];
//     let consecutiveAtDateSegments = [];
//     const DATE_PARTS_DELIMITER = " ";
//     const TIME_PARTS_DELIMITER = " ";

//     let isProcessingDatePart = true;
//     for (let atSegment of atSegments) {
//         if(atSegment.startsWith("at")) {
//             console.log("[Time] atSegment=", atSegment);
//             isProcessingDatePart = false;
//             if(consecutiveAtDateSegments.length) {
//                 dateParts.push(consecutiveAtDateSegments.join(" "));
//                 consecutiveAtDateSegments = [];
//             }
//             consecutiveAtTimeSegments.push(atSegment);
//         }
//         else { //if(atSegment.startsWith("every") || atSegment.startsWith("on")) {
//             console.log("[Date] atSegment=", atSegment);
//             isProcessingDatePart = true;
//             if(consecutiveAtTimeSegments.length) {
//                 timeParts.push(consecutiveAtTimeSegments.join(" "));
//                 consecutiveAtTimeSegments = [];
//             }
//             consecutiveAtDateSegments.push(atSegment);
//         }
//     }
//     // Add anything we didnt clear at the end
//     if (consecutiveAtTimeSegments.length) {
//         console.log("remaining time, pushing: ", consecutiveAtTimeSegments);
//         timeParts.push(consecutiveAtTimeSegments.join(" "));
//     }
//     if (consecutiveAtDateSegments.length) {
//         console.log("remaining date, pushing: ", consecutiveAtDateSegments);
//         dateParts.push(consecutiveAtDateSegments.join(" "));
//     }

//     // create the map and return
//     let dateToTimeMap = {};
//     for (let i = 0; i < Math.max(timeParts.length, dateParts.length); i++) {
//         if (i == timeParts.length) {
//             dateToTimeMap[dateParts[i]] = [];
//         }
//         else {
//             dateToTimeMap[dateParts[i]] = timeParts[i];
//         }
//     }
//     return dateToTimeMap;
// }
// 

// doesnt work because it will think that "every 2 days", the "2" is a timePart
// [see tests for examples]
// function getDateToTimePartsMapFromReminderDateTimeText(str) {
//     str = str.toLowerCase();
//     function _isAtSegmentATimePart(words) {
//         // make sure all "words" in the atSegment only contain "time words"
//         for (let word of words) {
//             // each word has to either be time number or meridiem or "at"
//             if (!isTimeNumber(word) && !isMeridiem(word) && word != "at") {
//                 return false;
//             }
//         }
//         return true;
//     }

//     // algorithm:
//     //  1- remove any "and" or ","
//     //  2- split by " "
//     //  3- find all the time parts and mark everything else as date parts
//     //      3.1- sliding window for time, keep pushing until its not time
//     //      3.2- replace all of these timeParts with "|||"
//     //      3.3- split by "|||" to find date parts
//     //  4- form the map
   
//     let atSegments = str
//         // remove any "and" or ","
//         .replace(/\band\b|,/g, "")
//         .split(" ")
//         .filter(x => !!x) // make sure no undefines are in the list
//         .map(x => x.trim().replace(/ {1,}/g, " ")) // trim and remove double spaces
//         .filter(x => !!x.length); // make sure no empty strings are in the list
//     str = atSegments.join(" ");

//     let timeParts = []; // every element: timeWords
//     let currentWindow = []; // every element: timeWord
//     for(let i = 0; i < atSegments.length; i++) {
//         let atSegment = atSegments[i];
//         console.log("atSegment=", atSegment);
//         if (_isAtSegmentATimePart([atSegment])) {
//             console.log("atSegment is time, pushing");
//             currentWindow.push(atSegment);
//         }
//         else {
//             console.log("atSegment is not time");
//             if(currentWindow.length && !(currentWindow.length == 1 && currentWindow[0] == "at")) {
//                 console.log("pushing to indices");
//                 timeParts.push(currentWindow.join(" "));
//                 currentWindow = [];
//             }
//         }
//     }
//     // Add anything we didnt clear at the end
//     if(currentWindow.length && !(currentWindow.length == 1 && currentWindow[0] == "at")) {
//         console.log("pushing to indices");
//         timeParts.push(currentWindow.join(" "));
//         currentWindow = [];
//     }
    
//     let dateParts = [];
//     for(let timePart of timeParts) {
//         str = str.replace(new RegExp(timePart, 'g'), '|||');
//     }
//     console.log("splitting after = ", str.split('|||'));
//     dateParts = str.split('|||')
//         .filter(x => !!x) // make sure no undefines are in the list
//         .map(x => x.trim().replace(/ {1,}/g, " ")) // trim and remove double spaces
//         .filter(x => !!x.length); // make sure no empty strings are in the list


//     console.log("----------------------------------------------------------------");

//     // create the map and return
//     let dateToTimeMap = {};
//     for (let i = 0; i < Math.max(timeParts.length, dateParts.length); i++) {
//         if (i == timeParts.length) {
//             dateToTimeMap[dateParts[i]] = [];
//         }
//         else {
//             dateToTimeMap[dateParts[i]] = timeParts[i];
//         }
//     }
//     return dateToTimeMap;
// }
