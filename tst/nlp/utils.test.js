const utils = require("../../nlp/utils.js"),
    { NLPContainer, NLPDate, NLPTime, NLPInterval } = require("../../nlp/models/date.js");

describe("_parseTimesStringToArray", () => {
    it("should work", () => {
        expect(utils._parseTimesStringToArray("3")).toEqual(["3"]);
        expect(utils._parseTimesStringToArray("3 pm")).toEqual(["3", "pm"]);
        expect(utils._parseTimesStringToArray("at 3")).toEqual(["3"]);
        expect(utils._parseTimesStringToArray("at 3:03 4:30")).toEqual(["3:03", "4:30"]);
        expect(utils._parseTimesStringToArray("at 3:3,4 pm")).toEqual(["3:3", "4", "pm"]);
        // input doesnt make sense but thats the expected output..
        expect(utils._parseTimesStringToArray("at 14,15:20 and 5 a.m")).toEqual(["14", "15:20", "5", "a.m"]);
    });
});

describe("regexMatchDateTextOrdinal", () => {
    it("should work with isOnRequired = true", () => {
        let map = {
            "on the 3rd": { "day": "3" },
            "on march the 3rd": { "month": "march", "day": "3" },
            "on august the 25th": { "month": "august", "day": "25" },
            "on june 20": { "month": "june", "day": "20" },
            "on the 25th of march": { "month": "march", "day": "25" },
            "on september 22nd": { "month": "september", "day": "22" },
            "on september 22": { "month": "september", "day": "22" },
            "on 22 of september": { "month": "september", "day": "22" },
            "on 22nd of september": { "month": "september", "day": "22" },
            "in 2 saturdays": null,
            "on saturday": null,
            "5": null,
            "in 8 minutes": null,
            "on 02/03": null,
            "on 9/15/2020": null,
            "at 5 pm": null,
            "5 pm": null,
        };
        for (let key in map) {
            let result = utils.regexMatchDateTextOrdinal(key, true);
            if (map[key] == null) {
                expect(result).toEqual(null);
            } else {
                let { regexMatch, indices } = result;
                expect(regexMatch[indices.month]).toEqual(map[key].month);
                expect(regexMatch[indices.day]).toEqual(map[key].day);
            }
        }
    });
});

describe("_convertDatesTextToNLPObjects", () => {
    it("should work", () => {
        let map = {
            "every wednesday": [new NLPInterval(undefined, "wednesday")],
            "every hour": [new NLPInterval(undefined, "hour")],
            "every wednesday thursday": [new NLPInterval(undefined, "wednesday"), new NLPInterval(undefined, "thursday")],
            "on 02/03, 02/04": [new NLPDate(null, 2, 3), new NLPDate(null, 2, 4)],
            "on 02/03/2019": [new NLPDate(2019, 2, 3)],
            "on 02/03/19": [new NLPDate(2019, 2, 3)],
            "on march the 2nd, april the 1st": [new NLPDate(null, 3, 2), new NLPDate(null, 4, 1)],
            "on the 2nd of march, april the 1st": [new NLPDate(null, 3, 2), new NLPDate(null, 4, 1)],
            "on the 2nd of march, 1st of april": [new NLPDate(null, 3, 2), new NLPDate(null, 4, 1)],
            "on the 2nd of march, the 1st of april": [new NLPDate(null, 3, 2), new NLPDate(null, 4, 1)],
            "on march the 2nd, the 1st of april": [new NLPDate(null, 3, 2), new NLPDate(null, 4, 1)],
            "on monday and tuesday": [new NLPInterval(undefined, "monday"), new NLPInterval(undefined, "tuesday")],
            "on the 4th": [new NLPDate(null, undefined, 4)],
            "on the 4th and 5th of march": [new NLPDate(null, 3, 5), new NLPDate(null, undefined, 4)],
            "on the 4th and march the 5th": [new NLPDate(null, undefined, 4), new NLPDate(null, 3, 5)],
            "march the 5th, the 4th": [new NLPDate(null, 3, 5), new NLPDate(null, undefined, 4)],
            "in 10 minutes": [new NLPInterval(10, "minutes")],
            "10 minutes": [new NLPInterval(10, "minutes")],
            "tomorrow": [new NLPInterval(1, "day")],
            "in 2 tuesdays": [new NLPInterval(2, "tuesdays")],
            "every 2 wednesdays and every thursday": [new NLPInterval(2, "wednesdays"), new NLPInterval(undefined, "thursday")],
            "every 3 hours until 9 pm": [new NLPInterval(3, 'hours')]
        };
        for(let key in map) {
            expect(utils._convertDatesTextToNLPObjects(key)).toEqual(map[key]);
        }
    });
});

describe("getDateToTimePartsMapFromReminderDateTimeText", () => {
    it("should work", () => {
        let map = {
            "at 3": {
                "undefined": "at 3",
            },
            "at 3 and at 4": {
                "undefined": "at 3 at 4",
            },
            "7 pm": {
                "undefined": "7 pm",
            },
            "on 02/03 at 3": {
                "on 02/03": "at 3",
            },
            "on 02/03/2019 at 3": {
                "on 02/03/2019": "at 3",
            },
            "on 02/03, 02/04,02/05 at 3, 4 pm and 5 am": {
                "on 02/03 , 02/04 , 02/05": "at 3 4 pm 5 am",
            },
            "every wednesday and thursday at 3, 4 pm and 5 am and every tuesday at 3 pm": {
                "every wednesday and thursday": "at 3 4 pm 5 am",
                "every tuesday": "at 3 pm",
            },
            "this wednesday at 3, 4 pm and on tuesday at 3 am": {
                "this wednesday": "at 3 4 pm",
                "on tuesday": "at 3 am",
            },
            "every monday at 2 am and tuesday at 3 pm": {
                "every monday": "at 2 am",
                "tuesday": "at 3 pm",
            },
            "in 2 days at 3, 4 pm and every wednesday at 3 pm": {
                "in 2 days": "at 3 4 pm",
                "every wednesday": "at 3 pm",
            },
            "in 2 days and in 4 weeks at 3 4 pm and every 2 wednesdays at 3 pm": {
                "in 2 days and in 4 weeks": "at 3 4 pm",
                "every 2 wednesdays": "at 3 pm",
            },
            "on wednesday": {
                "on wednesday": [],
            },
            "in 5 minutes": {
                "in 5 minutes": [],
            },
            "5 minutes": {
                "5 minutes": [],
            }
        };
        for (let key in map) {
            expect(utils.getDateToTimePartsMapFromReminderDateTimeText(key)).toEqual(map[key]);
        }
    });
});

describe("getNLPContainersFromReminderDateTimeText", () => {
    it("should work", () => {
        let map = {
            "at 3:04": [new NLPContainer(null, new NLPTime(3, 4))],
            "at 3 and at 4": [new NLPContainer(null, new NLPTime(3)), new NLPContainer(null, new NLPTime(4))],
            "7 pm": [new NLPContainer(null, new NLPTime(7, 0, "pm"))],
            "on 02/03 at 3": [new NLPContainer(new NLPDate(null, 2, 3), new NLPTime(3))],
            "on 02/03 at 3, 4 pm and 5 am": [
                new NLPContainer(new NLPDate(null, 2, 3), new NLPTime(3, 0, "pm")),
                new NLPContainer(new NLPDate(null, 2, 3), new NLPTime(4, 0, "pm")),
                new NLPContainer(new NLPDate(null, 2, 3), new NLPTime(5, 0, "am")),
            ],
            "on 02/03/2019 at 3, 4 pm and 5 am": [
                new NLPContainer(new NLPDate(2019, 2, 3), new NLPTime(3, 0, "pm")),
                new NLPContainer(new NLPDate(2019, 2, 3), new NLPTime(4, 0, "pm")),
                new NLPContainer(new NLPDate(2019, 2, 3), new NLPTime(5, 0, "am")),
            ],
            "every wednesday at 3, 4 pm and 5 am and every tuesday at 3 pm": [
                new NLPContainer(new NLPInterval(undefined, "wednesday"), new NLPTime(3, 0, "pm")),
                new NLPContainer(new NLPInterval(undefined, "wednesday"), new NLPTime(4, 0, "pm")),
                new NLPContainer(new NLPInterval(undefined, "wednesday"), new NLPTime(5, 0, "am")),
                new NLPContainer(new NLPInterval(undefined, "tuesday"), new NLPTime(3, 0, "pm")),
            ],
            "this wednesday at 3, 4 pm and on tuesday at 3 am": [
                new NLPContainer(new NLPInterval(undefined, "wednesday"), new NLPTime(3, 0, "pm")),
                new NLPContainer(new NLPInterval(undefined, "wednesday"), new NLPTime(4, 0, "pm")),
                new NLPContainer(new NLPInterval(undefined, "tuesday"), new NLPTime(3, 0, "am")),

            ],
            "on wednesday": [
                new NLPContainer(new NLPInterval(undefined, "wednesday")),
            ],
            "on tuesday, monday at 3 pm": [
                new NLPContainer(new NLPInterval(undefined, "tuesday"), new NLPTime(3, 0, "pm")),
                new NLPContainer(new NLPInterval(undefined, "monday"), new NLPTime(3, 0, "pm")),
            ],
            "every 3 wednesdays, every 2 tuesdays at 4 pm to": [
                new NLPContainer(new NLPInterval(3, "wednesdays"), new NLPTime(4, 0, "pm")),
                new NLPContainer(new NLPInterval(2, "tuesdays"), new NLPTime(4, 0, "pm")),
            ],
            "every 3 wednesdays, 2 tuesdays at 4 pm to": [
                new NLPContainer(new NLPInterval(3, "wednesdays"), new NLPTime(4, 0, "pm")),
                new NLPContainer(new NLPInterval(2, "tuesdays"), new NLPTime(4, 0, "pm")),
            ],
            "in 2 saturdays": [
                new NLPContainer(new NLPInterval(2, "saturdays")),
            ],
            "every 3 mondays, 2 tuesdays": [
                new NLPContainer(new NLPInterval(3, "mondays")),
                new NLPContainer(new NLPInterval(2, "tuesdays")),
            ],
        };
        for (let key in map) {
            expect(utils.getNLPContainersFromReminderDateTimeText(key)).toEqual(map[key]);
        }
    });
});


describe("getDatePartsFromString", () => {
    it("should work", () => {
        let map = {
            "on 02/03 at 3": [
                "on 02/03",
            ],
            "on 02/03 at 3, 4 pm and 5 am": [
                "on 02/03",
            ],
            "every wednesday at 3, 4 pm and 5 am and every tuesday at 3 pm": [
                "every wednesday",
                "every tuesday",
            ],
            "this wednesday at 3, 4 pm and on tuesday at 3 am": [
                "this wednesday",
                "on tuesday",
            ],
            "every monday at 2 am and tuesday at 3 pm": [
                "every monday",
                "tuesday"
            ],
            "in 2 days at 3, 4 pm and every wednesday at 3 pm": [
                "in 2 days",
                "every wednesday",
            ],
            "on wednesday": [
                "on wednesday",
            ]
        };
        for (let key in map) {
            expect(utils.getDatePartsFromString(key)).toEqual(map[key]);
        }
    });
});