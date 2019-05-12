const utils = require("../../nlp/utils.js");

describe("isMeridiem", () => {
    it("should work", () => {
        let expectedTrue = ["am", "Pm", "a.m.", "p.m.", "a.m", "p.m", "A.m", "P.m", "am"];
        for (let word of expectedTrue) {
            expect(utils.isMeridiem(word)).toEqual(true);
        }

        let expectedFalse = [" am", "p..m", "asdfasf", "", " ", "a m"];
        for (let word of expectedFalse) {
            expect(utils.isMeridiem(word)).toEqual(false);
        }
    });
});

describe("isTimeNumber", () => {
    it("should work", () => {
        let expectedTrue = ["3", "4", "15", "05", "304", "503", "3:04", "3:10", "155:1513:10"];
        for (let word of expectedTrue) {
            expect(utils.isTimeNumber(word)).toEqual(true);
        }

        let expectedFalse = ["3am", "3 am", "asdjfask", "d3", "fkj3f:343"];
        for (let word of expectedFalse) {
            expect(utils.isTimeNumber(word)).toEqual(false);
        }
    });
});

describe("_parseTimesStringToArray", () => {
    it("should work", () => {
        expect(utils._parseTimesStringToArray("at 3")).toEqual(["3"]);
        expect(utils._parseTimesStringToArray("at 3 4")).toEqual(["3", "4"]);
        expect(utils._parseTimesStringToArray("at 3,4 pm")).toEqual(["3", "4", "pm"]);
        expect(utils._parseTimesStringToArray("at 3,4 pm and 5 a.m")).toEqual(["3", "4", "pm", "5", "a.m"]);
    });
});

describe("getDateToTimePartsMapFromReminderDateTimeText", () => {
    it("should work", () => {
        let map = {
            "on 02/03 at 3": {
                "on 02/03": "at 3",
            },
            "on 02/03 at 3, 4 pm and 5 am": {
                "on 02/03": "at 3, 4 pm, and, 5 am",
            },
            "every wednesday at 3, 4 pm and 5 am and every tuesday at 3 pm": {
                "every wednesday": "at 3, 4 pm, and, 5 am",
                "every tuesday": "at 3 pm",
            },
            "this wednesday at 3, 4 pm and on tuesday at 3 am": {
                "this wednesday": "at 3, 4 pm",
                "on tuesday": "at 3 am",
            },
            "every monday at 2 am and tuesday at 3 pm": {
                "every monday": "at 2 am",
                "tuesday": "at 3 pm",
            },
            "in 2 days at 3, 4 pm and every wednesday at 3 pm": {
                "in 2 days": "at 3, 4 pm",
                "every wednesday": "at 3 pm",
            },
            "on wednesday": {
                "on wednesday": [],
            }
        };
        for (let key in map) {
            expect(utils.getDateToTimePartsMapFromReminderDateTimeText(key)).toEqual(map[key]);
        }
    });
});


describe("getDateToParsedTimesFromReminderDateTime", () => {
    it("should work", () => {
        let map = {
            "on 02/03 at 3": {
                "on 02/03": ["at 3"]
            },
            "on 02/03 at 3, 4 pm and 5 am": {
                "on 02/03": ["at 3 pm", "at 4 pm", "at 5 am"]
            },
            "every wednesday at 3, 4 pm and 5 am and every tuesday at 3 pm": {
                "every wednesday": ["at 3 pm", "at 4 pm", "at 5 am"],
                "every tuesday": ["at 3 pm"],
            },
            "this wednesday at 3, 4 pm and on tuesday at 3 am": {
                "this wednesday": ["at 3 pm", "at 4 pm"],
                "on tuesday": ["at 3 am"]
            },
            "on wednesday": {
                "on wednesday": []
            }
        };
        for (let key in map) {
            expect(utils.getDateToParsedTimesFromReminderDateTime(key)).toEqual(map[key]);
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