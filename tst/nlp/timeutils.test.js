const timeutils = require("../../nlp/timeutils.js"),
    { NLPTime } = require("../../nlp/models/date.js");

describe("getDateToNLPTimesMapFromReminderDateTimeText", () => {
    it("should work", () => {
        let map = {
            "at 3": {
                "undefined": [new NLPTime(3)],
            },
            "at 3 and at 4": {
                "undefined": [new NLPTime(3), new NLPTime(4)],
            },
            "7 pm": {
                "undefined": [new NLPTime(7, undefined, "pm")],
            },
            "on 02/03 at 3": {
                "on 02/03": [new NLPTime(3)],
            },
            "on 02/03/2019 at 3": {
                "on 02/03/2019": [new NLPTime(3)],
            },
            "on 02/03, 02/04,02/05 at 3, 4 pm and 5 am": {
                "on 02/03 , 02/04 , 02/05": [
                    new NLPTime(3, undefined, "pm"),
                    new NLPTime(4, undefined, "pm"),
                    new NLPTime(5, undefined, "am")
                ],
            },
            "every wednesday and thursday at 3, 4 pm and 5 am and every tuesday at 3 pm": {
                "every wednesday and thursday": [
                    new NLPTime(3, undefined, "pm"),
                    new NLPTime(4, undefined, "pm"),
                    new NLPTime(5, undefined, "am")
                ],
                "every tuesday": [new NLPTime(3, undefined, "pm")],
            },
            "this wednesday at 3, 4 pm and on tuesday at 3 am": {
                "this wednesday": [
                    new NLPTime(3, undefined, "pm"),
                    new NLPTime(4, undefined, "pm")
                ],
                "on tuesday": [
                    new NLPTime(3, undefined, "am")
                ],
            },
            "every monday at 2 am and tuesday at 3 pm": {
                "every monday": [
                    new NLPTime(2, undefined, "am")
                ],
                "tuesday": [new NLPTime(3, undefined, "pm")],
            },
            "in 2 days at 3, 4 pm and every wednesday at 3 pm": {
                "in 2 days": [
                    new NLPTime(3, undefined, "pm"),
                    new NLPTime(4, undefined, "pm")
                ],
                "every wednesday": [new NLPTime(3, undefined, "pm")],
            },
            "in 2 days and in 4 weeks at 3 4 pm and every 2 wednesdays at 3 pm": {
                "in 2 days and in 4 weeks": [
                    new NLPTime(3, undefined, "pm"),
                    new NLPTime(4, undefined, "pm")
                ],
                "every 2 wednesdays": [new NLPTime(3, undefined, "pm")],
            },
            "at 3 in the morning": {
                "in the morning": [new NLPTime(3, undefined, undefined)],
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
            expect(timeutils.getDateToNLPTimesMapFromReminderDateTimeText(key)).toEqual(map[key]);
        }
    });
});

describe("_parseTimesStringToArray", () => {
    it("should work", () => {
        expect(timeutils._parseTimesStringToArray("3")).toEqual(["3"]);
        expect(timeutils._parseTimesStringToArray("3 pm")).toEqual(["3", "pm"]);
        expect(timeutils._parseTimesStringToArray("at 3")).toEqual(["3"]);
        expect(timeutils._parseTimesStringToArray("at 3:03 4:30")).toEqual(["3:03", "4:30"]);
        expect(timeutils._parseTimesStringToArray("at 3:3,4 pm")).toEqual(["3:3", "4", "pm"]);
        // input doesnt make sense but thats the expected output..
        expect(timeutils._parseTimesStringToArray("at 14,15:20 and 5 a.m")).toEqual(["14", "15:20", "5", "a.m"]);
    });
});

describe("_getDateToTimePartsMapFromReminderDateTimeText", () => {
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
            expect(timeutils._getDateToTimePartsMapFromReminderDateTimeText(key)).toEqual(map[key]);
        }
    });
});

describe("_getNLPTimesFromTimePart", () => {
    it("should work", () => {
        let map = {
            "at 3 4 pm": [
                new NLPTime(3, undefined, "pm"),
                new NLPTime(4, undefined, "pm"),
            ],
            "at 3 4 pm 5 am": [
                new NLPTime(3, undefined, "pm"),
                new NLPTime(4, undefined, "pm"),
                new NLPTime(5, undefined, "am"),
            ],
            "at 3 at 4": [
                new NLPTime(3),
                new NLPTime(4),
            ],
            "": [],
        };
        for (let key in map) {
            expect(timeutils._getNLPTimesFromTimePart(key)).toEqual(map[key]);
        }
    });
});

describe("_getNLPTimesFromTimePart", () => {
    it("should work", () => {
        let map = {
            "at 3 4 pm": [
                new NLPTime(3, undefined, "pm"),
                new NLPTime(4, undefined, "pm"),
            ],
            "at 3 4 pm 5 am": [
                new NLPTime(3, undefined, "pm"),
                new NLPTime(4, undefined, "pm"),
                new NLPTime(5, undefined, "am"),
            ],
            "at 3 at 4": [
                new NLPTime(3),
                new NLPTime(4),
            ],
            "": [],
        };
        for (let key in map) {
            expect(timeutils._getNLPTimesFromTimePart(key)).toEqual(map[key]);
        }
    });
});