const utils = require("../../nlp/utils.js");

describe("_isMeridiem", () => {
    it("should work", () => {
        let expectedTrue = ["am", "Pm", "a.m.", "p.m.", "a.m", "p.m", "A.m", "P.m", "am"];
        for (let word of expectedTrue) {
            expect(utils._isMeridiem(word)).toEqual(true);
        }

        let expectedFalse = [" am", "p..m", "asdfasf", "", " ", "a m"];
        for (let word of expectedFalse) {
            expect(utils._isMeridiem(word)).toEqual(false);
        }
    });
});

describe("_isTimeNumber", () => {
    it("should work", () => {
        let expectedTrue = ["3", "4", "15", "05", "304", "503", "3:04", "3:10", "155:1513:10"];
        for (let word of expectedTrue) {
            expect(utils._isTimeNumber(word)).toEqual(true);
        }

        let expectedFalse = ["3am", "3 am", "asdjfask", "d3", "fkj3f:343"];
        for (let word of expectedFalse) {
            expect(utils._isTimeNumber(word)).toEqual(false);
        }
    });
});

describe("_parseTimesStringToArray", () => {
    it("should work", () => {
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
            "on march the 3rd": { "month": "march", "day": "3" },
            "on august the 25th": { "month": "august", "day": "25" },
            "on june 20": { "month": "june", "day": "20"},
            "on the 25th of march": { "month": "march", "day": "25"},
            "on september 22nd": {"month": "september", "day": "22"},
            "on september 22": {"month": "september", "day": "22"},
            "on 22 of september": {"month": "september", "day": "22"},
            "on 22nd of september": {"month": "september", "day": "22"},
            "in 2 saturdays": null,
            "on saturday": null,
            "5": null,
            "in 8 minutes": null,
            "on 02/03": null,
            "on 9/15/2020": null,
        };
        for (let key in map) {
            let result = utils.regexMatchDateTextOrdinal(key, true);
            if (map[key] == null) {
                expect(result).toEqual(null);
            }
            else {
                let { regexMatch, indices } = result;
                expect(regexMatch[indices.month]).toEqual(map[key].month);
                expect(regexMatch[indices.day]).toEqual(map[key].day);
            }
        }
    });
});

describe("_seperateDatesInDatesToTimesMap", () => {
    it("should work", () => {
        let keys = [
            {"every wednesday": ["at 3 pm"], }, // 1
            {"every wednesday thursday": ["at 4 pm"], }, // 2
            {"on 02/03, 02/04": ["at 3 pm"]}, // 3
            {"on 02/03/2019": ["at 3 pm"]}, // 4
            {"on march the 2nd, april the 1st": ["at 3 pm"]}, // 5
            {"on the 2nd of march, april the 1st": ["at 3 pm"]}, // 6
            {"on the 2nd of march, 1st of april": ["at 3 pm"]}, // 7
            {"on the 2nd of march, the 1st of april": ["at 3 pm"]}, // 8
            {"on march the 2nd, the 1st of april": ["at 3 pm"]}, // 9
            {"on march the 2nd, april the 1st": ["at 3 pm"]}, // 10
            {"on monday and tuesday": ["at 3 pm"]}, // 11
            {"on the 4th": ["u11"]}, // 12
            {"on the 4th and 5th of march": ["u12"]}, // 13
            {"on the 4th and march the 5th": ["u13"]}, // 14
            {"march the 5th, the 4th": ["u14"]}, // 15
            {"in 10 minutes": ["u15"]}, // 16
            {"10 minutes": ["u15"]}, // 17
            {"tomorrow": ["u16"]}, // 18
            {"in 2 tuesdays": ["u17"]}, // 19
            {"every 2 wednesdays and every thursday": ["u18"]}, // 20
        ];
        let values = [
            {"every wednesday": ["at 3 pm"], }, // 1
            {"every wednesday": ["at 4 pm"], "thursday": ["at 4 pm"]}, // 2
            {"on 02/03": ["at 3 pm"], "02/04": ["at 3 pm"]}, // 3
            {"on 02/03/2019": ["at 3 pm"]}, // 4
            {"on march the 2nd": ["at 3 pm"], "april the 1st": ["at 3 pm"]}, // 5
            {"on the 2nd of march": ["at 3 pm"], "april the 1st": ["at 3 pm"]}, // 6
            {"on the 2nd of march": ["at 3 pm"], "1st of april": ["at 3 pm"]}, // 7
            {"on the 2nd of march": ["at 3 pm"], "the 1st of april": ["at 3 pm"]}, // 8
            {"on march the 2nd": ["at 3 pm"], "the 1st of april": ["at 3 pm"]}, // 9
            {"on march the 2nd": ["at 3 pm"], "april the 1st": ["at 3 pm"]}, // 10
            {"on monday": ["at 3 pm"], "tuesday": ["at 3 pm"]}, // 11
            {"on the 4th": ["u11"]}, // 12
            {"on the 4th": ["u12"], "5th of march": ["u12"]}, // 13
            {"on the 4th": ["u13"], "march the 5th": ["u13"]}, // 14
            {"march the 5th": ["u14"], "the 4th": ["u14"]}, // 15
            {"in 10 minutes": ["u15"]}, // 16
            {"10 minutes": ["u15"]}, // 17
            {"tomorrow": ["u16"]}, // 18
            {"in 2 tuesdays": ["u17"]}, // 19
            {"every 2 wednesdays": ["u18"], "every thursday": ["u18"]}, // 20
        ];
        for(let i = 0; i < keys.length; i++) {
            expect(utils._seperateDatesInDatesToTimesMap(keys[i])).toEqual(values[i]);
        }
    });
});

describe("getDateToTimePartsMapFromReminderDateTimeText", () => {
    it("should work", () => {
        let map = {
            "on 02/03 at 3": {
                "on 02/03": "at 3",
            },
            "on 02/03/2019 at 3": {
                "on 02/03/2019": "at 3",
            },
            "on 02/03, 02/04,02/05 at 3, 4 pm and 5 am": {
                "on 02/03": "at 3 4 pm 5 am",
                "02/04": "at 3 4 pm 5 am",
                "02/05": "at 3 4 pm 5 am",
            },
            "every wednesday and thursday at 3, 4 pm and 5 am and every tuesday at 3 pm": {
                "every wednesday": "at 3 4 pm 5 am",
                "thursday": "at 3 4 pm 5 am",
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
                "in 2 days": "at 3 4 pm",
                "in 4 weeks": "at 3 4 pm",
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


describe("getDateToParsedTimesFromReminderDateTime", () => {
    it("should work", () => {
        let map = {
            "at 3": {
                "undefined": ["at 3"],
            },
            "at 3 and at 4": {
                "undefined": ["at 3", "at 4"],
            },
            "on 02/03 at 3": {
                "on 02/03": ["at 3"]
            },
            "on 02/03 at 3, 4 pm and 5 am": {
                "on 02/03": ["at 3 pm", "at 4 pm", "at 5 am"]
            },
            "on 02/03/2019 at 3, 4 pm and 5 am": {
                "on 02/03/2019": ["at 3 pm", "at 4 pm", "at 5 am"]
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
            },
            "on tuesday, monday at 3 pm": {
                "on tuesday": ["at 3 pm"],
                "monday": ["at 3 pm"],
            },
            "every 3 wednesdays, every 2 tuesdays at 4 pm to": {
                "every 3 wednesdays": ["at 4 pm"],
                "every 2 tuesdays": ["at 4 pm"],
            },
            "every 3 wednesdays, 2 tuesdays at 4 pm to": {
                "every 3 wednesdays": ["at 4 pm"],
                "2 tuesdays": ["at 4 pm"],
            },
            "on monday": {
                "on monday": [],
            },
            "in 2 saturdays": {
                "in 2 saturdays": [],
            },
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