const processTime = require('../../nlp/processTime.js'),
    timemachine = require("../../timemachine.js");

const DATE_FORMAT = "MM/DD/YYYY:HH:mm";
const TIME_ZONE = "America/Los_Angeles";
const TODAY_DATE_STRING = "June 3, 2018 12:00:00"; // string to be used in timemachine (Thats a sunday)
/**
 * 06/03: Sunday, 06/04: Monday, 06/05: Tuesday,
 * 06/06: Wednesday 06/07: Thursday, 06/08: Friday,
 * 06/09: Saturday
 */

describe("_splitReminderText", () => {
    it("should work when there's a delimiter", () => {
        let map = {
            '/r in 20 minutes to test that hi': {
                reminderDateTimeText: 'in 20 minute',
                reminderText: 'test that hi',
            },
            // test weird input
            '/r in 30 minutes remind me to test': {
                reminderDateTimeText: 'in 30 minute',
                reminderText: 'remind me to test',
            },
            '/r to test': {
                reminderDateTimeText: '',
                reminderText: 'test',
            }
        };
        for (let text in map) {
            let expectedResult = map[text];
            let result = processTime._splitReminderText(text);
            expect(result).toEqual(expectedResult);
        }
    });
    it("should work when there isn't a delimiter", () => {
        let map = {
            '/r in 40 minutes hand dry the ted baker': {
                reminderDateTimeText: 'in 40 minute',
                reminderText: 'hand dry the ted baker',
            },
            '/r tomorrow t': {
                reminderDateTimeText: 'tomorrow',
                reminderText: 't',
            },
            '/r on tue t': {
                reminderDateTimeText: 'on tuesday',
                reminderText: 't',
            },
            '/remindme at 5 do my homework': {
                reminderDateTimeText: 'at 5',
                reminderText: 'do my homework',
            },
            '/remindme tomorrow at 5 pm to do my homework': {
                reminderDateTimeText: 'tomorrow at 5 pm',
                reminderText: 'do my homework',
            },
            '/remindme in 5 minutes do my homework': {
                reminderDateTimeText: 'in 5 minute',
                reminderText: 'do my homework',
            },
            "/remindme in 5m go to school": {
                reminderDateTimeText: 'in 5 minute',
                reminderText: 'go to school',
            },
            '/remindme in 2h 2os dawafry': {
                reminderDateTimeText: 'in 2 hours',
                reminderText: '2os dawafry',
            },
            '/remindme at 3 p.m. i need to sleep tomorrow early at 10 pm': {
                reminderDateTimeText: 'at 3 p.m.',
                reminderText: 'i need to sleep tomorrow early at 10 pm',
            },
            '/remindme in 3 days bake the cake': {
                reminderDateTimeText: 'in 3 days',
                reminderText: 'bake the cake',
            },
            '/remindme at 5 pm thing, another': {
                reminderDateTimeText: 'at 5 pm',
                reminderText: 'thing, another',
            },
            "/remindme at 10pm Have college homework finished.": {
                reminderDateTimeText: "at 10:00pm",
                reminderText: "Have college homework finished.",
            },
            "/remindme 30/1/2020 8.30am hospital blood": {
                reminderDateTimeText: "30/1/2020 8.30am",
                reminderText: "hospital blood",
            },
            "/remindme at 7:30am text each other before school starts and have phone in pockets": {
                reminderDateTimeText: "at 7:30am",
                reminderText: "text each other before school starts and have phone in pockets",
            },
            "/remindme at 10am have college work taken care of": {
                reminderDateTimeText: "at 10:00am",
                reminderText: "have college work taken care of",
            },
            "/remindme on January 27th Disney+ subscription ends": {
                reminderDateTimeText: "on January 27th",
                reminderText: "Disney+ subscription ends",
            },
            "/remindme on Thursday \"Tomorrow is payday 💰 💵 \"": {
                reminderDateTimeText: "on Thursday",
                reminderText: "\"Tomorrow is payday 💰 💵 \"",
            },
            // SHOULDNT HAPPEN
            "/remindme on Thursday tomorrow is payday": {
                reminderDateTimeText: "on Thursday tomorrow",
                reminderText: "is payday",
            },
            "/remindme at 8am Check college email and text messages": {
                reminderDateTimeText: "at 8am",
                reminderText: "Check college email and text messages",
            },
            "/remindme at 11am check all college classes and have school bag and notebooks ready": {
                reminderDateTimeText: "at 11:00am",
                reminderText: "check all college classes and have school bag and notebooks ready",
            },
            "/remindme tomorrow at 3PM Text Agala when he's out of school": {
                reminderDateTimeText: "tomorrow at 3PM",
                reminderText: "Text Agala when he's out of school",
            },
            "/r at 12 tmrw call hsbc 800.524.9686": {
                reminderDateTimeText: "at 12:00 tomorrow",
                reminderText: "call hsbc 800.524.9686",
            },
            "/r on friday at 11:30 canxel PT and crown 28 and 29": {
                reminderDateTimeText: "on friday at 11:30",
                reminderText: "canxel PT and crown 28 and 29",
            },
            "/r in one month indian wells": {
                reminderDateTimeText: "in 1 months",
                reminderText: "indian wells",
            },
            "/remindme at 8PM go to the gym.": {
                reminderDateTimeText: "at 8PM",
                reminderText: "go to the gym.",
            },
            "/remindme at 8am tomorrow ask Gareth who is in charge of the preaching": {
                reminderDateTimeText: "at 8am tomorrow",
                reminderText: "ask Gareth who is in charge of the preaching",
            },
            "/remindme every weekday at 6pm log my Earth Homes hours": {
                reminderDateTimeText: "every monday, tuesday, wednesday, thursday, friday at 6pm",
                reminderText: "log my Earth Homes hours",
            },
            '/r in 1 min test': {
                reminderText: 'test',
                reminderDateTimeText: 'in 1 minute'
            },
            '/r every day at 9 pm send the memes': {
                reminderText: 'send the memes',
                reminderDateTimeText: 'every days at 9 pm'
            },
            '/r in 30 min send the meme': {
                reminderText: 'send the meme',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r in 1 hour antifogging for helmet': {
                reminderText: 'antifogging for helmet',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r at 3:05 call mamy': {
                reminderText: 'call mamy',
                reminderDateTimeText: 'at 3:05'
            },
            '/r at 5:45 pm check the helmet catalog if it has pinlock': {
                reminderText: 'check the helmet catalog if it has pinlock',
                reminderDateTimeText: 'at 5:45 pm'
            },
            '/r tommorow at 1 pm template': {
                reminderText: 'template',
                reminderDateTimeText: 'tomorrow at 1 pm'
            },
            '/r every day until the 25th i am leaving my bike at the shop on saturday the 25th': {
                reminderText: 'i am leaving my bike at the shop on saturday the 25th',
                reminderDateTimeText: 'every days until the 25th'
            },
            '/r in 10 seconds test': {
                reminderText: 'test',
                reminderDateTimeText: 'in 10 seconds'
            },
            '/r in 2 months at 2 pm test': {
                reminderText: 'test',
                reminderDateTimeText: 'in 2 months at 2 pm'
            },
            '/r every 10 seconds test': {
                reminderText: 'test',
                reminderDateTimeText: 'every 10 seconds'
            },
            '/r after tomorrow test': {
                reminderText: 'test',
                reminderDateTimeText: 'after tomorrow'
            },
            '/r tomorrow test': {
                reminderText: 'test',
                reminderDateTimeText: 'tomorrow'
            },
            '/r on Monday at 4pm sort out Canadian heb sheet': {
                reminderText: 'sort out Canadian heb sheet',
                reminderDateTimeText: 'on Monday at 4pm'
            },
            '/r at noon t': {
                reminderText: 't',
                reminderDateTimeText: 'at noon'
            },
            '/r every monday at noon t': {
                reminderText: 't',
                reminderDateTimeText: 'every monday at noon'
            },
            '/r today at 6pm print & email doc': {
                reminderText: 'print & email doc',
                reminderDateTimeText: 'today at 6pm'
            },
            '/r in 2 weeks check if i did 600 miles (then do all the stuff in the owners manual)': {
                reminderText: 'check if i did 600 miles (then do all the stuff in the owners manual)',
                reminderDateTimeText: 'in 2 weeks'
            },
            '/r on the 31st at 8 pm remind kunal to pay me $1000': {
                reminderText: 'remind kunal to pay me $1000',
                reminderDateTimeText: 'on the 31st at 8 pm'
            },
            '/r in 2 weeks ping purvi': {
                reminderText: 'ping purvi',
                reminderDateTimeText: 'in 2 weeks'
            },
            '/r on the 23rd of march test': {
                reminderText: 'test',
                reminderDateTimeText: 'on the 23rd of march'
            },
            '/r on the 23rd of june test': {
                reminderText: 'test',
                reminderDateTimeText: 'on the 23rd of june'
            },
            '/r in four minutes test': {
                reminderText: 'test',
                reminderDateTimeText: 'in 4 minute'
            },
            '/r at 12:30pm ask Alex to bring the cable': {
                reminderText: 'ask Alex to bring the cable',
                reminderDateTimeText: 'at 12:30pm'
            },
            '/r in 1 minute test': {
                reminderText: 'test',
                reminderDateTimeText: 'in 1 minute'
            },
            '/r in 2 weeks i got the other cable holders to put it on the back of my desk': {
                reminderText: 'i got the other cable holders to put it on the back of my desk',
                reminderDateTimeText: 'in 2 weeks'
            },
            '/r in 2 hours get music for choir': {
                reminderText: 'get music for choir',
                reminderDateTimeText: 'in 2 hours'
            },
            '/r at 6:10 am tomorrow get music for choir': {
                reminderText: 'get music for choir',
                reminderDateTimeText: 'at 6:10 am tomorrow'
            },
            '/r at 6 mealplan': {
                reminderText: 'mealplan',
                reminderDateTimeText: 'at 6'
            },
            '/r at 16:40 every mon,tue,wed,thu,fri Do you need to move the 🚗?': {
                reminderText: 'Do you need to move the 🚗?',
                reminderDateTimeText: 'at 16:40 every monday, tuesday, wednesday, thursday, friday'
            },
            '/r every monday,tuesday,wednesday,thursday,friday at 16:40 Check to see if I need to move the 🚗': {
                reminderText: 'Check to see if I need to move the 🚗',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday at 16:40'
            },
            '/r every monday,tuesday,wednesday,thursday,friday at 07:50 Check to see if I need to move the 🚗': {
                reminderText: 'Check to see if I need to move the 🚗',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday at 07:50'
            },
            '/r every day at 06:30 Take the 🐶🐶 outside': {
                reminderText: 'Take the 🐶🐶 outside',
                reminderDateTimeText: 'every days at 06:30'
            },
            '/r every day at 16:00 Take the 🐶 🐶 outside': {
                reminderText: 'Take the 🐶 🐶 outside',
                reminderDateTimeText: 'every days at 16:00'
            },
            '/r 15:57 Test alert!!': {
                reminderText: 'Test alert!!',
                reminderDateTimeText: '15:57'
            },
            '/r every weekday at 07:50 Check to see if I need to move the 🚗': {
                reminderText: 'Check to see if I need to move the 🚗',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday at 07:50'
            },
            '/r every weekday at 7:50am Check to see if I need to move the 🚗': {
                reminderText: 'Check to see if I need to move the 🚗',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday at 7:50am'
            },
            '/r every weekday at 4:50pm Check to see if I need to move the 🚗': {
                reminderText: 'Check to see if I need to move the 🚗',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday at 4:50pm'
            },
            '/r every day at 6:30am Take the 🐶 🐶 outside': {
                reminderText: 'Take the 🐶 🐶 outside',
                reminderDateTimeText: 'every days at 6:30am'
            },
            '/r every day at 4pm Take the 🐶 🐶 outside': {
                reminderText: 'Take the 🐶 🐶 outside',
                reminderDateTimeText: 'every days at 4pm'
            },
            '/r 4.30pm GO CATCH BUS': {
                reminderText: 'GO CATCH BUS',
                reminderDateTimeText: '4.30pm'
            },
            '/r every Thursday 5am GROOM 👨‍🦰 & 🐶': {
                reminderText: 'GROOM 👨‍🦰 & 🐶',
                reminderDateTimeText: 'every Thursday 5am'
            },
            '/r 5am every Thursday GROOM 👨‍🦰 & 🐶': {
                reminderText: 'GROOM 👨‍🦰 & 🐶',
                reminderDateTimeText: '5am every Thursday'
            },
            '/r every Thursday at 6am GROOM 👨‍🦰 & 🐶': {
                reminderText: 'GROOM 👨‍🦰 & 🐶',
                reminderDateTimeText: 'every Thursday at 6am'
            },
            '/r every 1 at 8am Sharpen knives': {
                reminderText: 'Sharpen knives',
                reminderDateTimeText: 'every 1 at 8am'
            },
            '/r every 1at at 8am Sharpen knives': {
                reminderText: 'Sharpen knives',
                reminderDateTimeText: 'every 1at at 8am'
            },
            '/r at 9am tomorrow take workout clothes  & headphones with me': {
                reminderText: 'take workout clothes  & headphones with me',
                reminderDateTimeText: 'at 9am tomorrow'
            },
            '/r every 1st at 8am Sharpen knives': {
                reminderText: 'Sharpen knives',
                reminderDateTimeText: 'every 1st at 8am'
            },
            '/r every month on the 1st Sharpen knives': {
                reminderText: 'Sharpen knives',
                reminderDateTimeText: 'every months on the 1st'
            },
            '/r every 1 month Clean fan(s)': {
                reminderText: 'Clean fan(s)',
                reminderDateTimeText: 'every 1 months'
            },
            '/r every day at 7:50am and 4:40pm Check to see if I need to move the 🚗': {
                reminderText: 'Check to see if I need to move the 🚗',
                reminderDateTimeText: 'every days at 7:50am and 4:40pm'
            },
            '/r every day at 6:15am and 12:00pm and 4:00pm Take the 🐶🐶 outside': {
                reminderText: 'Take the 🐶🐶 outside',
                reminderDateTimeText: 'every days at 6:15am and 12:00pm and 4:00pm'
            },
            '/r every Thursday at 6am Groom self & 🐶': {
                reminderText: 'Groom self & 🐶',
                reminderDateTimeText: 'every Thursday at 6am'
            },
            '/r every day at 6:15am and 12:00pm and 4:00pm Walk the doggos!': {
                reminderText: 'Walk the doggos!',
                reminderDateTimeText: 'every days at 6:15am and 12:00pm and 4:00pm'
            },
            '/r every day at 6:15am Walk the dogs!': {
                reminderText: 'Walk the dogs!',
                reminderDateTimeText: 'every days at 6:15am'
            },
            '/r every day at 12:00pm Walk the dogs!': {
                reminderText: 'Walk the dogs!',
                reminderDateTimeText: 'every days at 12:00pm'
            },
            '/r every day at 4:00pm Walk the dogs!': {
                reminderText: 'Walk the dogs!',
                reminderDateTimeText: 'every days at 4:00pm'
            },
            '/r every day at 7:50am Move the car!': {
                reminderText: 'Move the car!',
                reminderDateTimeText: 'every days at 7:50am'
            },
            '/r every day at 4:40pm Move the car!': {
                reminderText: 'Move the car!',
                reminderDateTimeText: 'every days at 4:40pm'
            },
            '/r in 30 minutes charge my snugphones': {
                reminderText: 'charge my snugphones',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r in 2 hours call mamy': {
                reminderText: 'call mamy',
                reminderDateTimeText: 'in 2 hours'
            },
            '/r every day at 10 am eye drops (just once a day)': {
                reminderText: 'eye drops (just once a day)',
                reminderDateTimeText: 'every days at 10:00 am'
            },
            '/r at 4:40 pm every monday t': {
                reminderText: 't',
                reminderDateTimeText: 'at 4:40 pm every monday'
            },
            '/r on tuesday at 11 am pull out exercise thing and toothpics from bag': {
                reminderText: 'pull out exercise thing and toothpics from bag',
                reminderDateTimeText: 'on tuesday at 11:00 am'
            },
            '/r every min test': {
                reminderText: 'test',
                reminderDateTimeText: 'every minute'
            },
            '/r every 3 min t': {
                reminderText: 't',
                reminderDateTimeText: 'every 3 minute'
            },
            '/r every day at 5:40 pm run https://plx.corp.google.com/scripts2/script_5c._e5d808_0000_2819_a207_001a11c0bedc': {
                reminderText: 'run https://plx.corp.google.com/scripts2/script_5c._e5d808_0000_2819_a207_001a11c0bedc',
                reminderDateTimeText: 'every days at 5:40 pm'
            },
            '/r at 3 pm get some rubber bands from work': {
                reminderText: 'get some rubber bands from work',
                reminderDateTimeText: 'at 3 pm'
            },
            '/r at 3 pm eat and cleanup the room': {
                reminderText: 'eat and cleanup the room',
                reminderDateTimeText: 'at 3 pm'
            },
            '/r on sunday at 10 am take the longer route to avoid the bridge when im going to rataplooza': {
                reminderText: 'take the longer route to avoid the bridge when im going to rataplooza',
                reminderDateTimeText: 'on sunday at 10:00 am'
            },
            '/r in 2 weeks do i still think that I should get shelves 3shan a7ot el shoes w kda?': {
                reminderText: 'do i still think that I should get shelves 3shan a7ot el shoes w kda?',
                reminderDateTimeText: 'in 2 weeks'
            },
            '/r at 10 am rod 3la aydn': {
                reminderText: 'rod 3la aydn',
                reminderDateTimeText: 'at 10:00 am'
            },
            '/r at 5pm 💣 🧹': {
                reminderText: '💣 🧹',
                reminderDateTimeText: 'at 5pm'
            },
            '/r at 8 pm fix the reminder bot bug': {
                reminderText: 'fix the reminder bot bug',
                reminderDateTimeText: 'at 8 pm'
            },
            '/r at 5 pm im going to faraj after': {
                reminderText: 'im going to faraj after',
                reminderDateTimeText: 'at 5 pm'
            },
            '/r at 4:30pm dol + engrish': {
                reminderText: 'dol + engrish',
                reminderDateTimeText: 'at 4:30pm'
            },
            '/r at 4:30pm minecraft': {
                reminderText: 'minecraft',
                reminderDateTimeText: 'at 4:30pm'
            },
            '/r in 30 min get waterrr': {
                reminderText: 'get waterrr',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r on 07/03 fadel $21,699.25 after tax fe vanguard': {
                reminderText: 'fadel $21,699.25 after tax fe vanguard',
                reminderDateTimeText: 'on 07/03'
            },
            '/r at 9 pm take measurements and pics and request quotes from yelp': {
                reminderText: 'take measurements and pics and request quotes from yelp',
                reminderDateTimeText: 'at 9 pm'
            },
            '/r in 20 minutes put rats back': {
                reminderText: 'put rats back',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r at 1 pm dawa mamy': {
                reminderText: 'dawa mamy',
                reminderDateTimeText: 'at 1 pm'
            },
            '/r at 3:50 https://protonmail.com': {
                reminderText: 'https://protonmail.com',
                reminderDateTimeText: 'at 3:50'
            },
            '/r at 12:30pm 🚍 🎟': {
                reminderText: '🚍 🎟',
                reminderDateTimeText: 'at 12:30pm'
            },
            '/r every weekday at 5pm log work in journal': {
                reminderText: 'log work in journal',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday at 5pm'
            },
            '/r every month pay Jason $23.49 for comcast': {
                reminderText: 'pay Jason $23.49 for comcast',
                reminderDateTimeText: 'every months'
            },
            '/r on 05/15 ask preksha if she wants to play on 05/18, i havce a court reserved': {
                reminderText: 'ask preksha if she wants to play on 05/18, i havce a court reserved',
                reminderDateTimeText: 'on 05/15'
            },
            '/r in one hour check on gerrit build': {
                reminderText: 'check on gerrit build',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r at 4:30pm https://i.redd.it/ivwp7jatuuy21.jpg': {
                reminderText: 'https://i.redd.it/ivwp7jatuuy21.jpg',
                reminderDateTimeText: 'at 4:30pm'
            },
            '/r at 8:00am bread': {
                reminderText: 'bread',
                reminderDateTimeText: 'at 8:00am'
            },
            "/r in one week make buba's ad video": {
                reminderText: "make buba's ad video",
                reminderDateTimeText: 'in 1 week'
            },
            '/r every friday at 8 pm davis list:': {
                reminderText: 'davis list:',
                reminderDateTimeText: 'every friday at 8 pm'
            },
            '/r in 10 minutes relax': {
                reminderText: 'relax',
                reminderDateTimeText: 'in 10 minute'
            },
            '/r in 15 minutes assess my progress': {
                reminderText: 'assess my progress',
                reminderDateTimeText: 'in 15 minute'
            },
            '/r in 30 minutes relax and journal': {
                reminderText: 'relax and journal',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r in 20 minutes assess my progress': {
                reminderText: 'assess my progress',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 1 week read https://culttt.com/2014/11/10/creating-using-command-bus/': {
                reminderText: 'read https://culttt.com/2014/11/10/creating-using-command-bus/',
                reminderDateTimeText: 'in 1 week'
            },
            '/r next week care less - city': {
                reminderText: 'care less - city',
                reminderDateTimeText: 'next week'
            },
            "/r in 20 minutes look at Josh's REsume": {
                reminderText: "look at Josh's REsume",
                reminderDateTimeText: 'in 20 minute'
            },
            '/r at 5pm check on handler build': {
                reminderText: 'check on handler build',
                reminderDateTimeText: 'at 5pm'
            },
            '/r in 1 hour journal and  plan out rest of day': {
                reminderText: 'journal and  plan out rest of day',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r on friday night buy a tie and suit at home': {
                reminderText: 'buy a tie and suit at home',
                reminderDateTimeText: 'on friday night'
            },
            '/r in one hour check on build': {
                reminderText: 'check on build',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r in 1 week check lab results': {
                reminderText: 'check lab results',
                reminderDateTimeText: 'in 1 week'
            },
            '/r in 30 minutes meet with gurujiwan and look at his dev environment': {
                reminderText: 'meet with gurujiwan and look at his dev environment',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r at 6PM wake up Hannah': {
                reminderText: 'wake up Hannah',
                reminderDateTimeText: 'at 6PM'
            },
            '/r at 6pm learn epson printer': {
                reminderText: 'learn epson printer',
                reminderDateTimeText: 'at 6pm'
            },
            '/r in 5 seconds do whatever': {
                reminderText: 'do whatever',
                reminderDateTimeText: 'in 5 seconds'
            },
            '/r at 12:15 buy flour': {
                reminderText: 'buy flour',
                reminderDateTimeText: 'at 12:15'
            },
            '/r at 4 go to print shop': {
                reminderText: 'go to print shop',
                reminderDateTimeText: 'at 4'
            },
            '/r in 5 seconds eat': {
                reminderText: 'eat',
                reminderDateTimeText: 'in 5 seconds'
            },
            '/r at 7pm wash my car wash towels': {
                reminderText: 'wash my car wash towels',
                reminderDateTimeText: 'at 7pm'
            },
            '/r in 1m t': {
                reminderText: 't',
                reminderDateTimeText: 'in 1 minute'
            },
            '/r in 1s t': {
                reminderText: 't',
                reminderDateTimeText: 'in 1 seconds'
            },
            '/r in 1m t1m': {
                reminderText: 't1m',
                reminderDateTimeText: 'in 1 minute'
            },
            '/r in 1m t1/list': {
                reminderText: 't1/list',
                reminderDateTimeText: 'in 1 minute'
            },
            '/r in 1s t1s': {
                reminderText: 't1s',
                reminderDateTimeText: 'in 1 seconds'
            },
            '/r in 2 hours 📧': {
                reminderText: '📧',
                reminderDateTimeText: 'in 2 hours'
            },
            '/r tomorrow at 10:20am reschedule with Daunish': {
                reminderText: 'reschedule with Daunish',
                reminderDateTimeText: 'tomorrow at 10:20am'
            },
            '/r tomorrow night follow up with': {
                reminderText: 'follow up with',
                reminderDateTimeText: 'tomorrow night'
            },
            '/r at 4pm double check that I am working on RFC': {
                reminderText: 'double check that I am working on RFC',
                reminderDateTimeText: 'at 4pm'
            },
            '/r at 7:00 meet with Hao': {
                reminderText: 'meet with Hao',
                reminderDateTimeText: 'at 7:00'
            },
            '/r tomorrow at 2 print your shipping label': {
                reminderText: 'print your shipping label',
                reminderDateTimeText: 'tomorrow at 2'
            },
            '/r in 30m charge snugphones': {
                reminderText: 'charge snugphones',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r at 7:30pm print shipping label': {
                reminderText: 'print shipping label',
                reminderDateTimeText: 'at 7:30pm'
            },
            '/r tomorrow at 2pm send Hannah the letter': {
                reminderText: 'send Hannah the letter',
                reminderDateTimeText: 'tomorrow at 2pm'
            },
            '/r at 6 pm get volleybal,vinegar and showergel from target': {
                reminderText: 'get volleybal,vinegar and showergel from target',
                reminderDateTimeText: 'at 6 pm'
            },
            '/r tomorrow at 10:15am request RFC comments': {
                reminderText: 'request RFC comments',
                reminderDateTimeText: 'tomorrow at 10:15am'
            },
            '/r at 9:00pm do forecasts': {
                reminderText: 'do forecasts',
                reminderDateTimeText: 'at 9:00pm'
            },
            '/r in one hour check on flight': {
                reminderText: 'check on flight',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r at 6 pm e7gz sultan weeding': {
                reminderText: 'e7gz sultan weeding',
                reminderDateTimeText: 'at 6 pm'
            },
            '/r at 1 pm charge portable charger': {
                reminderText: 'charge portable charger',
                reminderDateTimeText: 'at 1 pm'
            },
            '/r at 7 pm buy splint for my ankle': {
                reminderText: 'buy splint for my ankle',
                reminderDateTimeText: 'at 7 pm'
            },
            '/r at 10pm take my vitamins': {
                reminderText: 'take my vitamins',
                reminderDateTimeText: 'at 10:00pm'
            },
            '/r every day at 10 pm take my vitamins': {
                reminderText: 'take my vitamins',
                reminderDateTimeText: 'every days at 10:00 pm'
            },
            '/r at 1 schedule drums': {
                reminderText: 'schedule drums',
                reminderDateTimeText: 'at 1'
            },
            '/r tomorrow at 11am buy suit from banana republic and drop off UPS package': {
                reminderText: 'buy suit from banana republic and drop off UPS package',
                reminderDateTimeText: 'tomorrow at 11:00am'
            },
            '/r tomorrow at 2PM leave for wedding soon': {
                reminderText: 'leave for wedding soon',
                reminderDateTimeText: 'tomorrow at 2PM'
            },
            '/r in 30 minutes look into if projects are stuck again': {
                reminderText: 'look into if projects are stuck again',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r at 1:40 wake up Hannah': {
                reminderText: 'wake up Hannah',
                reminderDateTimeText: 'at 1:40'
            },
            '/r in 20m call Hannah': {
                reminderText: 'call Hannah',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 20 minutes wash face': {
                reminderText: 'wash face',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r  eat in 7 minutes': {
                reminderText: 'eat in 7 minutes',
                reminderDateTimeText: ''
            },
            '/r  cum in 2 minutes': {
                reminderText: 'cum in 2 minutes',
                reminderDateTimeText: ''
            },
            '/r in 1h https://www.privacytools.io/browsers/#about_config': {
                reminderText: 'https://www.privacytools.io/browsers/#about_config',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r on friday t': {
                reminderText: 't',
                reminderDateTimeText: 'on friday'
            },
            '/r every friday at 2 pm t': {
                reminderText: 't',
                reminderDateTimeText: 'every friday at 2 pm'
            },
            '/r in 40 minutes take cast iron out of oven': {
                reminderText: 'take cast iron out of oven',
                reminderDateTimeText: 'in 40 minute'
            },
            '/r at 8am ask Arturo to run Prod CSL Regression tests': {
                reminderText: 'ask Arturo to run Prod CSL Regression tests',
                reminderDateTimeText: 'at 8am'
            },
            "/r at 8am write up what you're going to say in standup": {
                reminderText: "write up what you're going to say in standup",
                reminderDateTimeText: 'at 8am'
            },
            '/r  get chicken at 2pm': {
                reminderText: 'get chicken at 2pm',
                reminderDateTimeText: ''
            },
            '/r at 2pm get chicken': {
                reminderText: 'get chicken',
                reminderDateTimeText: 'at 2pm'
            },
            '/r at 7pm get Hao to fix QA': {
                reminderText: 'get Hao to fix QA',
                reminderDateTimeText: 'at 7pm'
            },
            '/r at 7pm launch a wedding signs product to QA': {
                reminderText: 'launch a wedding signs product to QA',
                reminderDateTimeText: 'at 7pm'
            },
            '/r in 20m charge snugphonesp': {
                reminderText: 'charge snugphonesp',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r tomorrow at 2pm pay my parking ticket': {
                reminderText: 'pay my parking ticket',
                reminderDateTimeText: 'tomorrow at 2pm'
            },
            "/r tomorrow at 10am start on Ashley's requests": {
                reminderText: "start on Ashley's requests",
                reminderDateTimeText: 'tomorrow at 10:00am'
            },
            '/r on wednesday at 7 pm ping ogla and laura to setup time': {
                reminderText: 'ping ogla and laura to setup time',
                reminderDateTimeText: 'on wednesday at 7 pm'
            },
            '/r on thursday at 8 pm ping Yin to setup time': {
                reminderText: 'ping Yin to setup time',
                reminderDateTimeText: 'on thursday at 8 pm'
            },
            '/r at 10:3 t': {
                reminderText: 't',
                reminderDateTimeText: 'at 10:3'
            },
            '/r at 12:30pm 🏦': {
                reminderText: '🏦',
                reminderDateTimeText: 'at 12:30pm'
            },
            '/r at 4 do ashley H Request': {
                reminderText: 'do ashley H Request',
                reminderDateTimeText: 'at 4'
            },
            '/r at 7pm figure out what to do about missing rubber jabra': {
                reminderText: 'figure out what to do about missing rubber jabra',
                reminderDateTimeText: 'at 7pm'
            },
            '/r at 4pm look forrubber ear thing for jabra': {
                reminderText: 'look forrubber ear thing for jabra',
                reminderDateTimeText: 'at 4pm'
            },
            '/r at 10pm reflect on growth mindset. My current mindset may be blocking me from learning soft skills such as delegation which are essential for me to be promoted': {
                reminderText: 'reflect on growth mindset. My current mindset may be blocking me from learning soft skills such as delegation which are essential for me to be promoted',
                reminderDateTimeText: 'at 10:00pm'
            },
            '/r at 10pm reflect on growth mindset since My current mindset may be blocking me from learning soft skills such as delegation which are essential for me to be promoted': {
                reminderText: 'reflect on growth mindset since My current mindset may be blocking me from learning soft skills such as delegation which are essential for me to be promoted',
                reminderDateTimeText: 'at 10:00pm'
            },
            '/r at 10pm reflect on growth mindset since  current mindset may be blocking me from learning soft skills such as delegation': {
                reminderText: 'reflect on growth mindset since  current mindset may be blocking me from learning soft skills such as delegation',
                reminderDateTimeText: 'at 10:00pm'
            },
            '/r at 10pm reflect on changing my fixed mindset regarding my career abilities to a growth mindset': {
                reminderText: 'reflect on changing my fixed mindset regarding my career abilities to a growth mindset',
                reminderDateTimeText: 'at 10:00pm'
            },
            '/r in 1 minute cough': {
                reminderText: 'cough',
                reminderDateTimeText: 'in 1 minute'
            },
            '/r at 10 reflect on changing my fixed mindset regarding my career abilities to a growth mindset': {
                reminderText: 'reflect on changing my fixed mindset regarding my career abilities to a growth mindset',
                reminderDateTimeText: 'at 10:00'
            },
            '/r at 2PM REVERT AWS KEYS BEFORE PUSHING TO QA*': {
                reminderText: 'REVERT AWS KEYS BEFORE PUSHING TO QA*',
                reminderDateTimeText: 'at 2PM'
            },
            '/r in 30m more paperclips from work for rats hammock': {
                reminderText: 'more paperclips from work for rats hammock',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r in 50m matchstick ask frank  what % they have': {
                reminderText: 'matchstick ask frank  what % they have',
                reminderDateTimeText: 'in 50 minute'
            },
            '/r in 1h heidelberg': {
                reminderText: 'heidelberg',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r tomorrow at 9am get CD reader': {
                reminderText: 'get CD reader',
                reminderDateTimeText: 'tomorrow at 9am'
            },
            '/r every 10s until 8:56 t': {
                reminderText: 't',
                reminderDateTimeText: 'every 10 seconds until 8:56'
            },
            '/r at 6:30pm pack my bags for toronto - passport and wash clothes': {
                reminderText: 'pack my bags for toronto - passport and wash clothes',
                reminderDateTimeText: 'at 6:30pm'
            },
            '/r next week order pca toner on amazon': {
                reminderText: 'order pca toner on amazon',
                reminderDateTimeText: 'next week'
            },
            '/r at 11pm tonight work on USIMC website': {
                reminderText: 'work on USIMC website',
                reminderDateTimeText: 'at 11:00pm tonight'
            },
            '/r next Tuesday request to put RFC on roadmap': {
                reminderText: 'request to put RFC on roadmap',
                reminderDateTimeText: 'next Tuesday'
            },
            '/r at 9am get my laundry, pack clothes, and pack my portable charger': {
                reminderText: 'get my laundry, pack clothes, and pack my portable charger',
                reminderDateTimeText: 'at 9am'
            },
            '/r at 9 pm ping pong robot': {
                reminderText: 'ping pong robot',
                reminderDateTimeText: 'at 9 pm'
            },
            '/r at 6 take ping pong racket with me': {
                reminderText: 'take ping pong racket with me',
                reminderDateTimeText: 'at 6'
            },
            '/r tomorrow update USIMC website': {
                reminderText: 'update USIMC website',
                reminderDateTimeText: 'tomorrow'
            },
            '/r at 5:20 leave in 15m': {
                reminderText: 'leave in 15m',
                reminderDateTimeText: 'at 5:20'
            },
            '/r in 20m charge snugphones': {
                reminderText: 'charge snugphones',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 3 hours check in on Jocelyn and see if anything going slowly for CSL testing': {
                reminderText: 'check in on Jocelyn and see if anything going slowly for CSL testing',
                reminderDateTimeText: 'in 3 hours'
            },
            '/r in 5 minutes run cache purge jobs': {
                reminderText: 'run cache purge jobs',
                reminderDateTimeText: 'in 5 minute'
            },
            '/r at 9am get ready for deployment': {
                reminderText: 'get ready for deployment',
                reminderDateTimeText: 'at 9am'
            },
            '/r on thursday at 2 pm call mamy es2lha 3amalet eh fel gadwal': {
                reminderText: 'call mamy es2lha 3amalet eh fel gadwal',
                reminderDateTimeText: 'on thursday at 2 pm'
            },
            '/r at 11am 🔍': {
                reminderText: '🔍',
                reminderDateTimeText: 'at 11:00am'
            },
            '/r 11am 🔍': {
                reminderText: '🔍',
                reminderDateTimeText: '11am'
            },
            '/r at 11 am 🔍': {
                reminderText: '🔍',
                reminderDateTimeText: 'at 11:00 am'
            },
            '/r at 17:00 tomorrow get Reuben collection': {
                reminderText: 'get Reuben collection',
                reminderDateTimeText: 'at 17:00 tomorrow'
            },
            '/r at 12 pm 💸': {
                reminderText: '💸',
                reminderDateTimeText: 'at 12:00 pm'
            },
            '/r on monday at 5 pm geb kobayat ml sho3’l': {
                reminderText: 'geb kobayat ml sho3’l',
                reminderDateTimeText: 'on monday at 5 pm'
            },
            '/r in 10 minutes wake up': {
                reminderText: 'wake up',
                reminderDateTimeText: 'in 10 minute'
            },
            '/r in 45 minutes move tables': {
                reminderText: 'move tables',
                reminderDateTimeText: 'in 45 minute'
            },
            '/r every day at 10 pm kalem mamy': {
                reminderText: 'kalem mamy',
                reminderDateTimeText: 'every days at 10:00 pm'
            },
            '/r in 5 minutes wake up': {
                reminderText: 'wake up',
                reminderDateTimeText: 'in 5 minute'
            },
            '/r at 3:10 leave for the gate': {
                reminderText: 'leave for the gate',
                reminderDateTimeText: 'at 3:10'
            },
            '/r every minute feed D-boy': {
                reminderText: 'feed D-boy',
                reminderDateTimeText: 'every minute'
            },
            '/r at 12pm 💼': {
                reminderText: '💼',
                reminderDateTimeText: 'at 12:00pm'
            },
            '/r at 12 pm 💼': {
                reminderText: '💼',
                reminderDateTimeText: 'at 12:00 pm'
            },
            '/r every 15 minutes мать': {
                reminderText: 'мать',
                reminderDateTimeText: 'every 15 minute'
            },
            '/r in 20m cups mel sho3’l': {
                reminderText: 'cups mel sho3’l',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r on monday at 2 pm call school of rock if they didnt get back to me': {
                reminderText: 'call school of rock if they didnt get back to me',
                reminderDateTimeText: 'on monday at 2 pm'
            },
            '/r on tuesday at 11 am lazem aklm GP sports ysl7oly el lock 3’er kda el mofta7 dh kaman hyboz': {
                reminderText: 'lazem aklm GP sports ysl7oly el lock 3’er kda el mofta7 dh kaman hyboz',
                reminderDateTimeText: 'on tuesday at 11:00 am'
            },
            '/r in 1 hour make sure I am working on React': {
                reminderText: 'make sure I am working on React',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r in 2 hours make sure I made progress on journaling': {
                reminderText: 'make sure I made progress on journaling',
                reminderDateTimeText: 'in 2 hours'
            },
            '/r at 10 am 📞': {
                reminderText: '📞',
                reminderDateTimeText: 'at 10:00 am'
            },
            '/r in 1 hour stop working on React': {
                reminderText: 'stop working on React',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r in two hours reminder bot is great!': {
                reminderText: 'reminder bot is great!',
                reminderDateTimeText: 'in 2 hours'
            },
            '/r  pick up the kids at 3:20 tomorrow': {
                reminderText: 'pick up the kids at 3:20 tomorrow',
                reminderDateTimeText: ''
            },
            '/r tomorrow at 10:10am work on https://minted.atlassian.net/browse/NPD-1083': {
                reminderText: 'work on https://minted.atlassian.net/browse/NPD-1083',
                reminderDateTimeText: 'tomorrow at 10:10am'
            },
            '/r tomorrow update certbot': {
                reminderText: 'update certbot',
                reminderDateTimeText: 'tomorrow'
            },
            '/r at 12 pm yterm pip': {
                reminderText: 'yterm pip',
                reminderDateTimeText: 'at 12:00 pm'
            },
            '/r tommorow at 10 am check ap marks': {
                reminderText: 'check ap marks',
                reminderDateTimeText: 'tomorrow at 10:00 am'
            },
            '/r in 5 minutes ask Nathan': {
                reminderText: 'ask Nathan',
                reminderDateTimeText: 'in 5 minute'
            },
            '/r every day at 8 pm 🦎': {
                reminderText: '🦎',
                reminderDateTimeText: 'every days at 8 pm'
            },
            '/r at 1 pm email PLY3 ask them if they found my snugphones': {
                reminderText: 'email PLY3 ask them if they found my snugphones',
                reminderDateTimeText: 'at 1 pm'
            },
            '/r at 9 pm email amazon seler ask them if they’ll have it again': {
                reminderText: 'email amazon seler ask them if they’ll have it again',
                reminderDateTimeText: 'at 9 pm'
            },
            "/r at 12pm check how long I've played NitW": {
                reminderText: "check how long I've played NitW",
                reminderDateTimeText: 'at 12:00pm'
            },
            '/r  read the book on Architecting': {
                reminderText: 'read the book on Architecting',
                reminderDateTimeText: ''
            },
            '/r every 4th April Crazy was born in 1998¡': {
                reminderText: 'Crazy was born in 1998¡',
                reminderDateTimeText: 'every 4th April'
            },
            '/r in 2h call window guys': {
                reminderText: 'call window guys',
                reminderDateTimeText: 'in 2 hours'
            },
            '/r at 2 pm 💼': {
                reminderText: '💼',
                reminderDateTimeText: 'at 2 pm'
            },
            '/r in 30 minutes get back to Grace': {
                reminderText: 'get back to Grace',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r in 1 hour assess my progress': {
                reminderText: 'assess my progress',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r every 5 minutes follow  @virallaunchers': {
                reminderText: 'follow  @virallaunchers',
                reminderDateTimeText: 'every 5 minute'
            },
            '/r in 20 minutes do work with Hannah': {
                reminderText: 'do work with Hannah',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 10 minutes stop working': {
                reminderText: 'stop working',
                reminderDateTimeText: 'in 10 minute'
            },
            '/r in 10 minutes stop working on compit machine': {
                reminderText: 'stop working on compit machine',
                reminderDateTimeText: 'in 10 minute'
            },
            '/r in 20 minutes wash my face': {
                reminderText: 'wash my face',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r at 9am make sure I bring my microfibers': {
                reminderText: 'make sure I bring my microfibers',
                reminderDateTimeText: 'at 9am'
            },
            '/r at 2 order another boomerang lw msh 3l desk': {
                reminderText: 'order another boomerang lw msh 3l desk',
                reminderDateTimeText: 'at 2'
            },
            '/r in 20 minutes stop reading domain design': {
                reminderText: 'stop reading domain design',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 20 minutes stop working on USIMC': {
                reminderText: 'stop working on USIMC',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 20 minutes stop working on Translationu': {
                reminderText: 'stop working on Translationu',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 20 minutes stop workign on young': {
                reminderText: 'stop workign on young',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r at 3 pm manual': {
                reminderText: 'manual',
                reminderDateTimeText: 'at 3 pm'
            },
            '/r at 8pm think about texting family chat': {
                reminderText: 'think about texting family chat',
                reminderDateTimeText: 'at 8pm'
            },
            '/r in 10 days pay my credit card Nordstrom': {
                reminderText: 'pay my credit card Nordstrom',
                reminderDateTimeText: 'in 10 days'
            },
            '/r at 10:05 t': {
                reminderText: 't',
                reminderDateTimeText: 'at 10:05'
            },
            '/r in 2 days Request to rotate EC2 keys': {
                reminderText: 'Request to rotate EC2 keys',
                reminderDateTimeText: 'in 2 days'
            },
            '/r on 08/02 check HSBC mamy tany': {
                reminderText: 'check HSBC mamy tany',
                reminderDateTimeText: 'on 08/02'
            },
            '/r in 3 hours follow upw it Jocelyn and let her know ETA fo rCU3 bug': {
                reminderText: 'follow upw it Jocelyn and let her know ETA fo rCU3 bug',
                reminderDateTimeText: 'in 3 hours'
            },
            '/r at 12 pm https://www.reddit.com/r/factorio/comments/cdqhkq/compact_4_way_junctions_analysispsa_are/': {
                reminderText: 'https://www.reddit.com/r/factorio/comments/cdqhkq/compact_4_way_junctions_analysispsa_are/',
                reminderDateTimeText: 'at 12:00 pm'
            },
            '/r tonight work on telegram': {
                reminderText: 'work on telegram',
                reminderDateTimeText: 'tonight'
            },
            '/r tomorrow delete access keys and let Wesley know when its done': {
                reminderText: 'delete access keys and let Wesley know when its done',
                reminderDateTimeText: 'tomorrow'
            },
            '/r at 3pm on Friday feed the ducsk': {
                reminderText: 'feed the ducsk',
                reminderDateTimeText: 'at 3pm on Friday'
            },
            '/r at 4:30pm send Prakash a message': {
                reminderText: 'send Prakash a message',
                reminderDateTimeText: 'at 4:30pm'
            },
            '/r at 8am every weekday wake up': {
                reminderText: 'wake up',
                reminderDateTimeText: 'at 8am every monday, tuesday, wednesday, thursday, friday'
            },
            '/r at 3 pm call el sheikh 2ollo hgelo belel': {
                reminderText: 'call el sheikh 2ollo hgelo belel',
                reminderDateTimeText: 'at 3 pm'
            },
            '/r in 2 hours write apology letter': {
                reminderText: 'write apology letter',
                reminderDateTimeText: 'in 2 hours'
            },
            '/r tomorrow at 7 install Alfred workflows and to work on telegram app and review other tasks': {
                reminderText: 'install Alfred workflows and to work on telegram app and review other tasks',
                reminderDateTimeText: 'tomorrow at 7'
            },
            '/r in 8 hours write apology': {
                reminderText: 'write apology',
                reminderDateTimeText: 'in 8 hours'
            },
            '/r at 8pm read domain book': {
                reminderText: 'read domain book',
                reminderDateTimeText: 'at 8pm'
            },
            '/r on Monday remind Grace of Super Rush Project Meeting': {
                reminderText: 'remind Grace of Super Rush Project Meeting',
                reminderDateTimeText: 'on Monday'
            },
            '/r in 2 hours talk to e comm': {
                reminderText: 'talk to e comm',
                reminderDateTimeText: 'in 2 hours'
            },
            '/r in 1 hour follow up with Lin': {
                reminderText: 'follow up with Lin',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r in 3 hours remember to delete keys and notify Wesley': {
                reminderText: 'remember to delete keys and notify Wesley',
                reminderDateTimeText: 'in 3 hours'
            },
            '/r in 10 minutes remember that graphql is turned off for my PKs': {
                reminderText: 'remember that graphql is turned off for my PKs',
                reminderDateTimeText: 'in 10 minute'
            },
            '/r on Monday arun did it': {
                reminderText: 'arun did it',
                reminderDateTimeText: 'on Monday'
            },
            '/r tomorrow organize the work tickets': {
                reminderText: 'organize the work tickets',
                reminderDateTimeText: 'tomorrow'
            },
            '/r in 20m 3ayez a3ml eh el weekend dij': {
                reminderText: '3ayez a3ml eh el weekend dij',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 20 minutes wash my mask': {
                reminderText: 'wash my mask',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 55 minutes repark my car': {
                reminderText: 'repark my car',
                reminderDateTimeText: 'in 55 minute'
            },
            '/r in 30 minutes start reading the book': {
                reminderText: 'start reading the book',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r at 5:00 organize my work tickets': {
                reminderText: 'organize my work tickets',
                reminderDateTimeText: 'at 5:00'
            },
            '/r at 1:28 eat': {
                reminderText: 'eat',
                reminderDateTimeText: 'at 1:28'
            },
            '/r at 1:29 eat': {
                reminderText: 'eat',
                reminderDateTimeText: 'at 1:29'
            },
            '/r in 50 minutes leave': {
                reminderText: 'leave',
                reminderDateTimeText: 'in 50 minute'
            },
            '/r at 5PM read domain book': {
                reminderText: 'read domain book',
                reminderDateTimeText: 'at 5PM'
            },
            '/r at 7pm read domain book': {
                reminderText: 'read domain book',
                reminderDateTimeText: 'at 7pm'
            },
            '/r at 8pm on Tuesday start working on iPhone app': {
                reminderText: 'start working on iPhone app',
                reminderDateTimeText: 'at 8pm on Tuesday'
            },
            '/r at 6:30 get Brittany': {
                reminderText: 'get Brittany',
                reminderDateTimeText: 'at 6:30'
            },
            '/r at 11 am call el sheikh aked 3leh': {
                reminderText: 'call el sheikh aked 3leh',
                reminderDateTimeText: 'at 11:00 am'
            },
            '/r tomorrow at 10am work on domain book and organize work tickets': {
                reminderText: 'work on domain book and organize work tickets',
                reminderDateTimeText: 'tomorrow at 10:00am'
            },
            '/r tomorrow at 9:50am run the washer': {
                reminderText: 'run the washer',
                reminderDateTimeText: 'tomorrow at 9:50am'
            },
            '/r at 11pm review my affirmations': {
                reminderText: 'review my affirmations',
                reminderDateTimeText: 'at 11:00pm'
            },
            '/r every day at 2:21 pm piss off aaron': {
                reminderText: 'piss off aaron',
                reminderDateTimeText: 'every days at 2:21 pm'
            },
            '/r at 2:21 pm piss off aaron': {
                reminderText: 'piss off aaron',
                reminderDateTimeText: 'at 2:21 pm'
            },
            '/r at 10:21 pm piss off aaron': {
                reminderText: 'piss off aaron',
                reminderDateTimeText: 'at 10:21 pm'
            },
            '/r every day at 10:21 pm piss off aaron': {
                reminderText: 'piss off aaron',
                reminderDateTimeText: 'every days at 10:21 pm'
            },
            '/r every day at 2:21 am piss off aaron': {
                reminderText: 'piss off aaron',
                reminderDateTimeText: 'every days at 2:21 am'
            },
            '/r in 1 hour send email about WFH and also organize my tasks': {
                reminderText: 'send email about WFH and also organize my tasks',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r at 9am send email about wfh and organize tasks': {
                reminderText: 'send email about wfh and organize tasks',
                reminderDateTimeText: 'at 9am'
            },
            '/r at 3:00 check in with SRE on the IAM user deletion': {
                reminderText: 'check in with SRE on the IAM user deletion',
                reminderDateTimeText: 'at 3:00'
            },
            '/r in 10 minutes work on high level task management': {
                reminderText: 'work on high level task management',
                reminderDateTimeText: 'in 10 minute'
            },
            '/r tomorrow reschedule super rich meeting': {
                reminderText: 'reschedule super rich meeting',
                reminderDateTimeText: 'tomorrow'
            },
            '/r tomorrow night work on project for Hannah': {
                reminderText: 'work on project for Hannah',
                reminderDateTimeText: 'tomorrow night'
            },
            '/r tonight read the domain book': {
                reminderText: 'read the domain book',
                reminderDateTimeText: 'tonight'
            },
            '/r in 15 minutes ask about variant invalidation': {
                reminderText: 'ask about variant invalidation',
                reminderDateTimeText: 'in 15 minute'
            },
            '/r tomorrow at 1pm schedule a dentist appointment': {
                reminderText: 'schedule a dentist appointment',
                reminderDateTimeText: 'tomorrow at 1pm'
            },
            '/r in Saturday go to target and buy slacks to tailor': {
                reminderText: 'go to target and buy slacks to tailor',
                reminderDateTimeText: 'in Saturday'
            },
            '/r on Saturday tailor my jeans': {
                reminderText: 'tailor my jeans',
                reminderDateTimeText: 'on Saturday'
            },
            '/r at 8am consider password complexity, salted hashing, etc': {
                reminderText: 'consider password complexity, salted hashing, etc',
                reminderDateTimeText: 'at 8am'
            },
            '/r at 12PM tomorrow make sure I finish merging security PRs by then': {
                reminderText: 'make sure I finish merging security PRs by then',
                reminderDateTimeText: 'at 12:00PM tomorrow'
            },
            "/r tomorrow look into the SKUS that jocelyn mentioned aren't resolving numbers": {
                reminderText: "look into the SKUS that jocelyn mentioned aren't resolving numbers",
                reminderDateTimeText: 'tomorrow'
            },
            '/r in 10 minutes stop timeboxed focus on my compit task description': {
                reminderText: 'stop timeboxed focus on my compit task description',
                reminderDateTimeText: 'in 10 minute'
            },
            '/r in 30 minutes stop timeboxed work on cart image task': {
                reminderText: 'stop timeboxed work on cart image task',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r in 30 minutes stop time boxed unit test work': {
                reminderText: 'stop time boxed unit test work',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r tomorrow at 10:50 consider if removing fxg will prevent us from being able to use a generalized compit config': {
                reminderText: 'consider if removing fxg will prevent us from being able to use a generalized compit config',
                reminderDateTimeText: 'tomorrow at 10:50'
            },
            '/r tomorrow at 10:50 use the python CLI to check for the what is the config render bucket string': {
                reminderText: 'use the python CLI to check for the what is the config render bucket string',
                reminderDateTimeText: 'tomorrow at 10:50'
            },
            '/r at 9 am call Bargain Hunt': {
                reminderText: 'call Bargain Hunt',
                reminderDateTimeText: 'at 9 am'
            },
            '/r in 1 hour rod 3la rachel': {
                reminderText: 'rod 3la rachel',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r at 1 eat again': {
                reminderText: 'eat again',
                reminderDateTimeText: 'at 1'
            },
            '/r in 20m moma interaction to impression with event id': {
                reminderText: 'moma interaction to impression with event id',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r tonight work on 1. Merging Security PRs and 2. Security project': {
                reminderText: 'work on 1. Merging Security PRs and 2. Security project',
                reminderDateTimeText: 'tonight'
            },
            '/r in 5 minutes run the next test': {
                reminderText: 'run the next test',
                reminderDateTimeText: 'in 5 minute'
            },
            '/r in 2 minutes begin the testa': {
                reminderText: 'begin the testa',
                reminderDateTimeText: 'in 2 minute'
            },
            '/r in 2 minutes run the next test': {
                reminderText: 'run the next test',
                reminderDateTimeText: 'in 2 minute'
            },
            '/r tomorrow at 9:50am reschedule the super rush meeting': {
                reminderText: 'reschedule the super rush meeting',
                reminderDateTimeText: 'tomorrow at 9:50am'
            },
            '/r in 1 hour call insurance': {
                reminderText: 'call insurance',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r at 4pm go over security merges': {
                reminderText: 'go over security merges',
                reminderDateTimeText: 'at 4pm'
            },
            '/r at 12 prepare questions for super rush': {
                reminderText: 'prepare questions for super rush',
                reminderDateTimeText: 'at 12:00'
            },
            '/r at 7pm pay Nordstrom card': {
                reminderText: 'pay Nordstrom card',
                reminderDateTimeText: 'at 7pm'
            },
            '/r in 30 minutes start work': {
                reminderText: 'start work',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r in 1 hour dahlia resume': {
                reminderText: 'dahlia resume',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r at 12 pm https://www.starbucks.ca/opportunity-youth': {
                reminderText: 'https://www.starbucks.ca/opportunity-youth',
                reminderDateTimeText: 'at 12:00 pm'
            },
            '/r at 7 follow up w/ nathan and aric': {
                reminderText: 'follow up w/ nathan and aric',
                reminderDateTimeText: 'at 7'
            },
            '/r tomorrow leave a note at room 1910 to ask for furniture': {
                reminderText: 'leave a note at room 1910 to ask for furniture',
                reminderDateTimeText: 'tomorrow'
            },
            '/r tomorrow pay nordstrom card': {
                reminderText: 'pay nordstrom card',
                reminderDateTimeText: 'tomorrow'
            },
            '/r tomorrow look into Front RAP': {
                reminderText: 'look into Front RAP',
                reminderDateTimeText: 'tomorrow'
            },
            '/r in 20 minutes check the oven': {
                reminderText: 'check the oven',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r at 3:20 tomorrow pikc up the kids': {
                reminderText: 'pikc up the kids',
                reminderDateTimeText: 'at 3:20 tomorrow'
            },
            '/r in one minute yastabot is awesome!': {
                reminderText: 'yastabot is awesome!',
                reminderDateTimeText: 'in 1 minute'
            },
            '/r in two minutes @yastabot is efficient': {
                reminderText: '@yastabot is efficient',
                reminderDateTimeText: 'in 2 minute'
            },
            '/r in 30 minutes check the oven': {
                reminderText: 'check the oven',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r every weekday pick up the kids at 3:20': {
                reminderText: 'pick up the kids at 3:20',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday'
            },
            '/r every weekday at 3:20 pick up the kids': {
                reminderText: 'pick up the kids',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday at 3:20'
            },
            '/r in two minutes check on the oven': {
                reminderText: 'check on the oven',
                reminderDateTimeText: 'in 2 minute'
            },
            '/r on wed t': {
                reminderText: 't',
                reminderDateTimeText: 'on wednesday'
            },
            '/r every wednesday at 2:40 pick up the kids': {
                reminderText: 'pick up the kids',
                reminderDateTimeText: 'every wednesday at 2:40'
            },
            '/r in two weeks schedule my cat’s vaccination': {
                reminderText: 'schedule my cat’s vaccination',
                reminderDateTimeText: 'in 2 weeks'
            },
            '/r on wednesday follow up with Nathan on Finnaces': {
                reminderText: 'follow up with Nathan on Finnaces',
                reminderDateTimeText: 'on wednesday'
            },
            '/r in 1 hour shsha': {
                reminderText: 'shsha',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r at 2 pm charge my iphone': {
                reminderText: 'charge my iphone',
                reminderDateTimeText: 'at 2 pm'
            },
            '/r on sunday at 8 pm 2ol le coach bokra eny 3ayez arkz 3la 1- mid game forehand/backhand how to spin and smash': {
                reminderText: '2ol le coach bokra eny 3ayez arkz 3la 1- mid game forehand/backhand how to spin and smash',
                reminderDateTimeText: 'on sunday at 8 pm'
            },
            '/r on monday at 10 am shof rachel 7war el VE': {
                reminderText: 'shof rachel 7war el VE',
                reminderDateTimeText: 'on monday at 10:00 am'
            },
            '/r at 10 am shof 7agat 3yon le amena, hat lista w klmhom yom el etnen': {
                reminderText: 'shof 7agat 3yon le amena, hat lista w klmhom yom el etnen',
                reminderDateTimeText: 'at 10:00 am'
            },
            '/r in 20 minutes check on the oven': {
                reminderText: 'check on the oven',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r every 30 minutes until 6 pm get up from my desk and stretch': {
                reminderText: 'get up from my desk and stretch',
                reminderDateTimeText: 'every 30 minute until 6 pm'
            },
            '/r every 10 seconds use yastabot!!!': {
                reminderText: 'use yastabot!!!',
                reminderDateTimeText: 'every 10 seconds'
            },
            '/r on august 5 at 4:30 pm schedule my cat’s vaccinations': {
                reminderText: 'schedule my cat’s vaccinations',
                reminderDateTimeText: 'on august 5 at 4:30 pm'
            },
            '/r every monday tuesday thursday friday at 3:20 pm and wednesday at 2:40 pm pick up the kids': {
                reminderText: 'pick up the kids',
                reminderDateTimeText: 'every monday tuesday thursday friday at 3:20 pm and wednesday at 2:40 pm'
            },
            '/r every week day at 9 am check my email before i start working': {
                reminderText: 'check my email before i start working',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday at 9 am'
            },
            '/r in 50 minutes get laundry': {
                reminderText: 'get laundry',
                reminderDateTimeText: 'in 50 minute'
            },
            '/r in 45 minutes get laundry': {
                reminderText: 'get laundry',
                reminderDateTimeText: 'in 45 minute'
            },
            '/r at 2pm Check on Salesforce and on the RAP': {
                reminderText: 'Check on Salesforce and on the RAP',
                reminderDateTimeText: 'at 2pm'
            },
            '/r in 25 days geb le ali el google hoodie': {
                reminderText: 'geb le ali el google hoodie',
                reminderDateTimeText: 'in 25 days'
            },
            '/r at 2 timebox a 30 minute investigation into the DA missing customer previews': {
                reminderText: 'timebox a 30 minute investigation into the DA missing customer previews',
                reminderDateTimeText: 'at 2'
            },
            '/r in 30 minutes stop investigating missing customer previews': {
                reminderText: 'stop investigating missing customer previews',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r on Friday at 10pm send audio to Anna': {
                reminderText: 'send audio to Anna',
                reminderDateTimeText: 'on Friday at 10:00pm'
            },
            '/r tomorrow at 5 bring home my earbuds': {
                reminderText: 'bring home my earbuds',
                reminderDateTimeText: 'tomorrow at 5'
            },
            '/r tomorrow at 9:30AM bring my earbuds to work': {
                reminderText: 'bring my earbuds to work',
                reminderDateTimeText: 'tomorrow at 9:30AM'
            },
            '/r at 11 schedule one on one with told': {
                reminderText: 'schedule one on one with told',
                reminderDateTimeText: 'at 11:00'
            },
            '/r in 30 minutes stop looking into cat page': {
                reminderText: 'stop looking into cat page',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r at 12:20 reserve volleyball court': {
                reminderText: 'reserve volleyball court',
                reminderDateTimeText: 'at 12:20'
            },
            '/r at 2 pm tf2 cc': {
                reminderText: 'tf2 cc',
                reminderDateTimeText: 'at 2 pm'
            },
            '/r in 5 minutes stop writing question': {
                reminderText: 'stop writing question',
                reminderDateTimeText: 'in 5 minute'
            },
            '/r on august 5 at 4:30 pm schedule my cat’s vaccines': {
                reminderText: 'schedule my cat’s vaccines',
                reminderDateTimeText: 'on august 5 at 4:30 pm'
            },
            '/r every weekday at 9 am check my email before i start working': {
                reminderText: 'check my email before i start working',
                reminderDateTimeText: 'every monday, tuesday, wednesday, thursday, friday at 9 am'
            },
            '/r on august 31 at 8 am simba’s vaccines are today at the woodland shelter': {
                reminderText: 'simba’s vaccines are today at the woodland shelter',
                reminderDateTimeText: 'on august 31 at 8 am'
            },
            '/r every 30 seconds use this bot!': {
                reminderText: 'use this bot!',
                reminderDateTimeText: 'every 30 seconds'
            },
            '/r  schedule my kids’ appointments': {
                reminderText: 'schedule my kids’ appointments',
                reminderDateTimeText: ''
            },
            '/r  schedule my kids’ appts tomorrow at 3:00 pm': {
                reminderText: 'schedule my kids’ appts tomorrow at 3:00 pm',
                reminderDateTimeText: ''
            },
            '/r tomorrow at 3 pm schedule my kids’ appts': {
                reminderText: 'schedule my kids’ appts',
                reminderDateTimeText: 'tomorrow at 3 pm'
            },
            '/r at 11 am 📎': {
                reminderText: '📎',
                reminderDateTimeText: 'at 11:00 am'
            },
            '/r in 15 minutes to ask again for PR': {
                reminderText: 'ask again for PR',
                reminderDateTimeText: 'in 15 minute'
            },
            '/r next week on Wednesday do https://minted.atlassian.net/browse/NPD-1188': {
                reminderText: 'do https://minted.atlassian.net/browse/NPD-1188',
                reminderDateTimeText: 'next week on Wednesday'
            },
            '/r every 2 mondays test': {
                reminderText: 'test',
                reminderDateTimeText: 'every 2 mondays'
            },
            '/r at 10 pm tala3 el crackers mn geb el kacket': {
                reminderText: 'tala3 el crackers mn geb el kacket',
                reminderDateTimeText: 'at 10:00 pm'
            },
            '/r in 10 days at 9:30 pm check the doc https://docs.google.com/document/d/1TxPnuk7P1DLVZtggJZINy9AGbiqSA4SYTI0y_L5QR9c/edit?usp=sharing': {
                reminderText: 'check the doc https://docs.google.com/document/d/1TxPnuk7P1DLVZtggJZINy9AGbiqSA4SYTI0y_L5QR9c/edit?usp=sharing',
                reminderDateTimeText: 'in 10 days at 9:30 pm'
            },
            '/r tomorrow at 10 am fix funkios': {
                reminderText: 'fix funkios',
                reminderDateTimeText: 'tomorrow at 10:00 am'
            },
            '/r 11.18.2019 at 10 am do test': {
                reminderText: 'do test',
                reminderDateTimeText: '11.18.2019 at 10:00 am'
            },
            '/r every day at 10 pm update the doc with what i have done': {
                reminderText: 'update the doc with what i have done',
                reminderDateTimeText: 'every days at 10:00 pm'
            },
            '/r on tuesday leave a little early so you can pick up your shoes': {
                reminderText: 'leave a little early so you can pick up your shoes',
                reminderDateTimeText: 'on tuesday'
            },
            '/r at 9am get my jeans': {
                reminderText: 'get my jeans',
                reminderDateTimeText: 'at 9am'
            },
            '/r at 7:10am wake up Hannah': {
                reminderText: 'wake up Hannah',
                reminderDateTimeText: 'at 7:10am'
            },
            '/r at 12 pm 📋': {
                reminderText: '📋',
                reminderDateTimeText: 'at 12:00 pm'
            },
            '/r at 9 pm checkout sahmoud channel': {
                reminderText: 'checkout sahmoud channel',
                reminderDateTimeText: 'at 9 pm'
            },
            '/r at 7 get keys https://twitter.com/Borderlands/status/1157335292782632960': {
                reminderText: 'get keys https://twitter.com/Borderlands/status/1157335292782632960',
                reminderDateTimeText: 'at 7'
            },
            '/r tomorrow at 12 pick up my blue jeans': {
                reminderText: 'pick up my blue jeans',
                reminderDateTimeText: 'tomorrow at 12:00'
            },
            '/r at 4:28 go to your 1 on 1 at Broadway': {
                reminderText: 'go to your 1 on 1 at Broadway',
                reminderDateTimeText: 'at 4:28'
            },
            '/r on friday the 23rd at 7 pm geb 60 cash ml ATM wana mrw7 3shan asebhom lel cleaner': {
                reminderText: 'geb 60 cash ml ATM wana mrw7 3shan asebhom lel cleaner',
                reminderDateTimeText: 'on friday the 23rd at 7 pm'
            },
            '/r on the 23rd at 7 pm geb 60 cash ml ATM wana mrw7 3shan asebhom lel cleaner': {
                reminderText: 'geb 60 cash ml ATM wana mrw7 3shan asebhom lel cleaner',
                reminderDateTimeText: 'on the 23rd at 7 pm'
            },
            '/r on Friday at 2pm call for quotes for dash cam installs': {
                reminderText: 'call for quotes for dash cam installs',
                reminderDateTimeText: 'on Friday at 2pm'
            },
            '/r in 30m iphone cable': {
                reminderText: 'iphone cable',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r in a week investigate failing pytests https://minted.slack.com/archives/CCX1ETABW/p1565115326030600': {
                reminderText: 'investigate failing pytests https://minted.slack.com/archives/CCX1ETABW/p1565115326030600',
                reminderDateTimeText: 'in 1 week'
            },
            '/r tonight work on • Look at every line, see if you understand it, for every single one of them, see which evidence you have and don’t have.': {
                reminderText: 'work on • Look at every line, see if you understand it, for every single one of them, see which evidence you have and don’t have.',
                reminderDateTimeText: 'tonight'
            },
            '/r on August 9th remind Hannah to book ticket': {
                reminderText: 'remind Hannah to book ticket',
                reminderDateTimeText: 'on August 9th'
            },
            '/r at 1:30 write Down the best practices': {
                reminderText: 'write Down the best practices',
                reminderDateTimeText: 'at 1:30'
            },
            '/r at 1:30 push config change forward if not approved by then': {
                reminderText: 'push config change forward if not approved by then',
                reminderDateTimeText: 'at 1:30'
            },
            '/r in 20 minutes focus': {
                reminderText: 'focus',
                reminderDateTimeText: 'in 20 minute'
            },
            '/r in 2 hours Lin Qu [2:19 PM]': {
                reminderText: 'Lin Qu [2:19 PM]',
                reminderDateTimeText: 'in 2 hours'
            },
            '/r at 3:30 prepare for your super rush meeting': {
                reminderText: 'prepare for your super rush meeting',
                reminderDateTimeText: 'at 3:30'
            },
            '/r on sunday sleep early for car repair appointment': {
                reminderText: 'sleep early for car repair appointment',
                reminderDateTimeText: 'on sunday'
            },
            '/r at 5pm check in with FICO score': {
                reminderText: 'check in with FICO score',
                reminderDateTimeText: 'at 5pm'
            },
            '/r tomorrow at 9:50am ensure that everyone is available for your super rush meeting': {
                reminderText: 'ensure that everyone is available for your super rush meeting',
                reminderDateTimeText: 'tomorrow at 9:50am'
            },
            '/r at 9:30 get tzitzis sizes': {
                reminderText: 'get tzitzis sizes',
                reminderDateTimeText: 'at 9:30'
            },
            '/r at 12:30 collect the mattress from Gareth': {
                reminderText: 'collect the mattress from Gareth',
                reminderDateTimeText: 'at 12:30'
            },
            '/r in 30m rick 21st at 8 am and pay': {
                reminderText: 'rick 21st at 8 am and pay',
                reminderDateTimeText: 'in 30 minute'
            },
            '/r every 3 weeks at 8 pm i have a retirement channel': {
                reminderText: 'i have a retirement channel',
                reminderDateTimeText: 'every 3 weeks at 8 pm'
            },
            '/r in 15 minutes call geico and cancel your rental': {
                reminderText: 'call geico and cancel your rental',
                reminderDateTimeText: 'in 15 minute'
            },
            '/r tomorrow print out my shipping label and return my shirt to neiman marcus': {
                reminderText: 'print out my shipping label and return my shirt to neiman marcus',
                reminderDateTimeText: 'tomorrow'
            },
            '/r today at 8 test': {
                reminderText: 'test',
                reminderDateTimeText: 'today at 8'
            },
            '/r at 2 pm tennis racket': {
                reminderText: 'tennis racket',
                reminderDateTimeText: 'at 2 pm'
            },
            '/r in 1 month call el clerk office tany w shof a5bar el ticket eh, 2olohom lsa mfesh 7aga gatly tany (a5er mra alol acall tany kaman shahr)': {
                reminderText: 'call el clerk office tany w shof a5bar el ticket eh, 2olohom lsa mfesh 7aga gatly tany (a5er mra alol acall tany kaman shahr)',
                reminderDateTimeText: 'in 1 months'
            },
            "/r every 2 sundays at 7 pm ro7 le newton b3d el sho3'l? a5er class 3ndo by5ls 5:10 pm monday,wednesday,thursday,friday": {
                reminderText: "ro7 le newton b3d el sho3'l? a5er class 3ndo by5ls 5:10 pm monday,wednesday,thursday,friday",
                reminderDateTimeText: 'every 2 sundays at 7 pm'
            },
            '/r at 10 remind Hannah to book a flight': {
                reminderText: 'remind Hannah to book a flight',
                reminderDateTimeText: 'at 10:00'
            },
            '/r in 1 hour timebox': {
                reminderText: 'timebox',
                reminderDateTimeText: 'in 1 hours'
            },
            '/r on Sunday sleep early for car shop appointment': {
                reminderText: 'sleep early for car shop appointment',
                reminderDateTimeText: 'on Sunday'
            },
            '/r on 10/01 hallpass for rick private classes': {
                reminderText: 'hallpass for rick private classes',
                reminderDateTimeText: 'on 10/01'
            },
            '/r on the 15th at 4:30 pm ask jackie about concrete drumming goals': {
                reminderText: 'ask jackie about concrete drumming goals',
                reminderDateTimeText: 'on the 15th at 4:30 pm'
            },
            '/r tomorrow review your senior engineer gameplan. Think about it from the point of view of “how do I need to grow as a person and as a dev?': {
                reminderText: 'review your senior engineer gameplan. Think about it from the point of view of “how do I need to grow as a person and as a dev?',
                reminderDateTimeText: 'tomorrow'
            },
        };
        for (let text in map) {
            let expectedResult = map[text];
            let result = processTime._splitReminderText(text);
            expect(result).toEqual(expectedResult);
        }
    });
});

describe("_convertFractionUnitsToIntegers", () => {
    it("should work", () => {
        let map = {
            "in 2.5 minutes": `in ${2.5*60} seconds`,
            "every 5.5 hours": `every ${5.5*60} minutes`,
            "every 1.5 weeks": `every ${11} days`,
            "in 2.5 minutes, 50 seconds": `in ${2.5*60} seconds, 50 seconds`,
        };

        for (let reminderDateTimeText in map) {
            let expectedResult = map[reminderDateTimeText];
            let result = processTime._convertFractionUnitsToIntegers(reminderDateTimeText);
            expect(result).toEqual(expectedResult);
        }
    });
});

function assertGetDate(map) {
    timemachine.config({ dateString: TODAY_DATE_STRING });
    for (let key in map) {
        let expectedResult = map[key];
        let result;
        try {
            result = processTime.getDate(key, TIME_ZONE);
        }
        catch (err) {
            console.log(`'${key}' failed with an exception: ${err}`);
            expect(false).toEqual(true);
        }
        
        expect(result.reminderText).toEqual(expectedResult.reminderText);
        if (expectedResult.reminderDates) {

            if (expectedResult.reminderDates.formattedDates) {
                let formattedResultDates = result.reminderDates.dates.map(x => x.format(DATE_FORMAT));
                let formattedExpectedDates = expectedResult.reminderDates.formattedDates;
                expect(formattedResultDates.sort()).toEqual(formattedExpectedDates.sort());
            } else if (expectedResult.reminderDates.recurringDates) {
                if (!result.reminderDates.recurringDates) {
                    console.error("no result.reminderDates.recurringDates for " + key);
                    expect(false).toEqual(true);
                }
                expect(result.reminderDates.recurringDates.sort()).toEqual(expectedResult.reminderDates.recurringDates.sort());
                if (!!expectedResult.reminderDates.formattedEndingConditionDate) {
                    expect(result.reminderDates.endingConditionDate.format(DATE_FORMAT))
                        .toEqual(expectedResult.reminderDates.formattedEndingConditionDate);
                } else {
                    expect(undefined).toEqual(result.reminderDates.endingConditionDate);
                }
            } else {
                console.error("You have to specify either formattedDates or recurringDates for assertion");
                expect(false).toEqual(true);
            }
        }
    }
    timemachine.reset();
}

describe("getDate", () => {
    it('should work in english for non recurring reminders', () => {
        let map = {
            '/r in an hour to x': {
                reminderText: 'x',
                reminderDates: {
                    formattedDates: ["06/03/2018:13:00"],
                }
            },
            '/r next week to test': {
                reminderText: 'test',
                reminderDates: {
                    formattedDates: ["06/10/2018:12:00"],
                }
            },
            'r in 1 thursday at 4 pm to test': {
                reminderText: 'test',
                reminderDates: {
                    formattedDates: ["06/07/2018:16:00"],
                }
            },
            '/r next week on thursday to test': {
                reminderText: 'test',
                reminderDates: {
                    formattedDates: ["06/07/2018:12:00"], // should be 06/14/2018
                }
            },
            '/r in the afternoon to hamada': {
                reminderText: 'hamada',
                reminderDates: {
                    formattedDates: ["06/03/2018:15:00"],
                }
            },
            "/r tomorrow morning hamada": {
                reminderText: 'hamada',
                reminderDates: {
                    formattedDates: ["06/04/2018:09:00"],
                }
            },
            "/r tonight hamada": {
                reminderText: 'hamada',
                reminderDates: {
                    formattedDates: ["06/03/2018:21:00"],
                }
            },
            "/r tomorrow night hamada": {
                reminderText: 'hamada',
                reminderDates: {
                    formattedDates: ["06/04/2018:21:00"],
                }
            },
            "/r tomorrow afternoon to t": {
                reminderText: 't',
                reminderDates: {
                    formattedDates: ["06/04/2018:15:00"],
                }
            },
            "/r on friday the 23rd to t": { // 23rd is not a friday
                reminderText: 't',
                reminderDates: {
                    formattedDates: ["06/23/2018:12:00"],
                }
            },
            // check if same weekday works
            '/remindme on sunday to ..': {
                reminderText: "..",
                reminderDates: {
                    formattedDates: ["06/10/2018:12:00"]
                },
            },
            '/remindme sunday to ..': {
                reminderText: "..",
                reminderDates: {
                    formattedDates: ["06/10/2018:12:00"]
                },
            },
            '/remindme at 2 pm to do my homework': {
                reminderText: 'do my homework',
                reminderDates: {
                    formattedDates: ["06/03/2018:14:00"],
                },
            },
            '/remindme tomorrow at 5 pm to do my homework': {
                reminderText: 'do my homework',
                reminderDates: {
                    formattedDates: ["06/04/2018:17:00"],
                },
            },
            '/remindme on wednesday at 3 pm and on saturday at 10 am to wake up': {
                reminderText: 'wake up',
                reminderDates: {
                    formattedDates: ["06/09/2018:10:00", "06/06/2018:15:00"],
                },
            },
            '/remindme in five minutes to check on the oven': {
                reminderText: 'check on the oven',
                reminderDates: {
                    formattedDates: ["06/03/2018:12:05"],
                },
            },
            '/remindme on wednesday to pickup the kids from school': {
                reminderText: 'pickup the kids from school',
                reminderDates: {
                    formattedDates: ["06/06/2018:12:00"],
                },
            },
            '/remindme on january 5th that today is my birthday!': {
                reminderText: 'today is my birthday!',
                reminderDates: {
                    formattedDates: ["01/05/2019:12:00"],
                },
            },
            '/remindme on 23rd of march to ...': {
                reminderText: '...',
                reminderDates: {
                    formattedDates: ["03/23/2019:12:00"],
                },
            },
            '/remindme on the 1st to ...': {
                reminderText: '...',
                reminderDates: {
                    formattedDates: ["07/01/2018:12:00"],
                },
            },
            '/remindme on 3 july to ...': {
                reminderText: '...',
                reminderDates: {
                    formattedDates: ["07/03/2018:12:00"],
                },
            },
            '/r in 30 minute to hihi': {
                reminderText: "hihi",
                reminderDates: {
                    formattedDates: ["06/03/2018:12:30"],
                },
            },
            // // missing in
            '/r 30 minutes to t': {
                reminderText: "t",
                reminderDates: {
                    formattedDates: ["06/03/2018:12:30"],
                },
            },
            '/r on 02/03 to t': {
                reminderText: "t",
                reminderDates: {
                    formattedDates: ["02/03/2019:12:00"],
                },
            },
            '/r on 02/03/2019 to t': {
                reminderText: "t",
                reminderDates: {
                    formattedDates: ["02/03/2019:12:00"],
                },
            },
            '/r on 02/03/21 to t': {
                reminderText: "t",
                reminderDates: {
                    formattedDates: ["02/03/2021:12:00"],
                },
            },
            // missing on/at
            '/r 5 am to t': {
                reminderText: "t",
                reminderDates: {
                    formattedDates: ["06/04/2018:05:00"],
                },
            },
            '/remindme 10 am tomorrow to ..': {
                reminderText: "..",
                reminderDates: {
                    formattedDates: ["06/04/2018:10:00"],
                },
            },
            '/remindme tuesday at 11 am to ..': {
                reminderText: "..",
                reminderDates: {
                    formattedDates: ["06/05/2018:11:00"],
                },
            },
            '/remindme tuesday 11 am to ..': {
                reminderText: "..",
                reminderDates: {
                    formattedDates: ["06/05/2018:11:00"],
                },
            },
        };
        assertGetDate(map);
    });
    it('should work in english for recurring reminders', () => {
        let map = {
            '/remindme every weekday at 12 pm to call my son in school to check on him': {
                reminderText: 'call my son in school to check on him',
                reminderDates: {
                    recurringDates: ["in 1 monday at 12 pm", "in 1 tuesday at 12 pm", "in 1 wednesday at 12 pm", "in 1 thursday at 12 pm", "in 1 friday at 12 pm"],
                },
            },
            '/remindme every hour to log my work': {
                reminderText: 'log my work',
                reminderDates: {
                    recurringDates: ["in 1 hour"],
                },
            },
            '/remindme every hour until 6 pm to log my work': {
                reminderText: 'log my work',
                reminderDates: {
                    recurringDates: ["in 1 hour"],
                    formattedEndingConditionDate: "06/03/2018:18:00",
                },
            },
            '/remindme every hour until 604 to log my work': {
                reminderText: 'log my work',
                reminderDates: {
                    recurringDates: ["in 1 hour"],
                    formattedEndingConditionDate: "06/03/2018:18:04",
                },
            },
            '/remindme every tuesday, wednesday at 3 and 4 pm and every saturday at 9 am to take my vitamins': {
                reminderText: 'take my vitamins',
                reminderDates: {
                    recurringDates: ["in 1 tuesday at 3 pm", "in 1 tuesday at 4 pm", "in 1 wednesday at 3 pm", "in 1 wednesday at 4 pm", "in 1 saturday at 9 am"],
                }
            },
            'fakarny kol youm etnen warba3 at 5 pm w kol youm talat at 7,8 am to test': {
                reminderText: 'test',
                reminderDates: {
                    recurringDates: ["in 1 monday at 5 pm", "in 1 wednesday at 5 pm", "in 1 tuesday at 7 am", "in 1 tuesday at 8 am"],
                },
            },
            '/remindme every weekday at 9 am and every weekend at 11 am to open up the store': {
                reminderText: 'open up the store',
                reminderDates: {
                    recurringDates: ["in 1 monday at 9 am", "in 1 tuesday at 9 am", "in 1 wednesday at 9 am",
                        "in 1 thursday at 9 am", "in 1 friday at 9 am", "in 1 saturday at 11 am", "in 1 sunday at 11 am"
                    ],
                }
            },
            '/remindme every monday and every tuesday to test': {
                reminderText: 'test',
                reminderDates: {
                    recurringDates: ['in 1 monday', 'in 1 tuesday'],
                }
            },
            '/remindme every minute and every hour to test': {
                reminderText: 'test',
                reminderDates: {
                    recurringDates: ['in 1 minute', 'in 1 hour'],
                }
            },
            '/remindme every 2 mondays and every 3 saturdays to test': {
                reminderText: 'test',
                reminderDates: {
                    recurringDates: ['in 2 monday', 'in 3 saturday'],
                }
            },
            // test weird input
            '/r every 30 minutes remind me to test': {
                reminderText: 'remind me to test',
                reminderDates: {
                    recurringDates: ['in 30 minute'],
                },
            },
        };
        assertGetDate(map);
    });
});