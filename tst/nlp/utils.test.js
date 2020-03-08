const utils = require("../../nlp/utils.js"),
    { NLPContainer, NLPDate, NLPTime, NLPInterval } = require("../../nlp/models/date.js");

describe("_regexMatchDateTextOrdinal", () => {
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
            let result = utils._regexMatchDateTextOrdinal(key, true);
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

describe("_convertDatesTextToNLPContainers", () => {
    it("should work", () => {
        let map = {
            "every wednesday": [new NLPContainer(new NLPInterval(undefined, "wednesday"))],
            "every hour": [new NLPContainer(new NLPInterval(undefined, "hour"))],
            "every wednesday thursday": [new NLPContainer(new NLPInterval(undefined, "wednesday")), new NLPContainer(new NLPInterval(undefined, "thursday"))],
            "on 02/03, 02/04": [new NLPContainer(new NLPDate(null, 2, 3)), new NLPContainer(new NLPDate(null, 2, 4))],
            "on 02/03/2019": [new NLPContainer(new NLPDate(2019, 2, 3))],
            "on 02/03/19": [new NLPContainer(new NLPDate(2019, 2, 3))],
            "on march the 2nd, april the 1st": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on the 2nd of march, april the 1st": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on the 2nd of march, 1st of april": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on the 2nd of march, the 1st of april": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on march the 2nd, the 1st of april": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on monday and tuesday": [new NLPContainer(new NLPInterval(undefined, "monday")), new NLPContainer(new NLPInterval(undefined, "tuesday"))],
            "on the 4th": [new NLPContainer(new NLPDate(null, undefined, 4))],
            "on the 4th and 5th of march": [new NLPContainer(new NLPDate(null, 3, 5)), new NLPContainer(new NLPDate(null, undefined, 4))],
            "on the 4th and march the 5th": [new NLPContainer(new NLPDate(null, undefined, 4)), new NLPContainer(new NLPDate(null, 3, 5))],
            "march the 5th, the 4th": [new NLPContainer(new NLPDate(null, 3, 5)), new NLPContainer(new NLPDate(null, undefined, 4))],
            "march the 5th the 4th": [new NLPContainer(new NLPDate(null, 3, 5)), new NLPContainer(new NLPDate(null, undefined, 4))],
            "in 10 minutes": [new NLPContainer(new NLPInterval(10, "minutes"))],
            "10 minutes": [new NLPContainer(new NLPInterval(10, "minutes"))],
            "tomorrow": [new NLPContainer(new NLPInterval(1, "day"))],
            "in 2 tuesdays": [new NLPContainer(new NLPInterval(2, "tuesdays"))],
            "every 2 wednesdays and every thursday": [new NLPContainer(new NLPInterval(2, "wednesdays")), new NLPContainer(new NLPInterval(undefined, "thursday"))],
            "every 3 hours until 9 pm": [new NLPContainer(new NLPInterval(3, 'hours'))],
            // "in the morning": [new NLPTime(9, undefined, "am")],
        };
        for(let key in map) {
            expect(utils._convertDatesTextToNLPContainers(key)).toEqual(map[key]);
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