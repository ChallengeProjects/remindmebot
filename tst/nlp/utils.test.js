const utils = require("../../nlp/utils.js"),
    { NLPContainer, NLPDate, NLPTime, NLPInterval } = require("../../nlp/models/date.js");

describe("_convertDatesTextToNLPContainers", () => {
    it("should work", () => {
        let map = {
            "every wednesday": [new NLPContainer(new NLPInterval(undefined, "wednesday"))],
            "every hour": [new NLPContainer(new NLPInterval(undefined, "hour"))],
            "every wednesday, thursday": [new NLPContainer(new NLPInterval(undefined, "wednesday")), new NLPContainer(new NLPInterval(undefined, "thursday"))],
            "on 02/03, 02/04": [new NLPContainer(new NLPDate(null, null, null, 2, 3)), new NLPContainer(new NLPDate(null, null, null, 2, 4))],
            "on 02/03/2019": [new NLPContainer(new NLPDate(2019, null, null, 2, 3))],
            "on 02/03/19": [new NLPContainer(new NLPDate(2019, null, null, 2, 3))],
            "on march the 2nd, april the 1st": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on the 2nd of march, april the 1st": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on the 2nd of march, 1st of april": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on the 2nd of march, the 1st of april": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on march the 2nd, the 1st of april": [new NLPContainer(new NLPDate(null, 3, 2)), new NLPContainer(new NLPDate(null, 4, 1))],
            "on monday and tuesday": [new NLPContainer(new NLPInterval(undefined, "monday")), new NLPContainer(new NLPInterval(undefined, "tuesday"))],
            "on the 4th": [new NLPContainer(new NLPDate(null, null, 4))],
            "on the 4th and 5th of march": [new NLPContainer(new NLPDate(null, 3, 4)), new NLPContainer(new NLPDate(null, 3, 5))],
            "march the 5th, the 4th": [new NLPContainer(new NLPDate(null, 3, 5)), new NLPContainer(new NLPDate(null, 3, 4))],
            "in 10 minutes": [new NLPContainer(new NLPInterval(10, "minutes"))],
            "10 minutes": [new NLPContainer(new NLPInterval(10, "minutes"))],
            "tomorrow": [new NLPContainer(new NLPInterval(1, "day"))],
            "in 2 tuesdays": [new NLPContainer(new NLPInterval(2, "tuesdays"))],
            "every 2 wednesdays and every thursday": [new NLPContainer(new NLPInterval(2, "wednesdays")), new NLPContainer(new NLPInterval(undefined, "thursday"))],
            "in the morning": [new NLPContainer(new NLPTime(9, undefined, "am"))],
            "next week": [new NLPContainer(new NLPInterval("next", "week"))],
            "friday next week": [new NLPContainer(new NLPInterval("next", "friday"))],
            "in 2 weeks on friday": [new NLPContainer(new NLPInterval(2, "friday"))],
            "on june 20": [new NLPContainer(new NLPDate(null, 6, 20))],
            "on 22 of september": [new NLPContainer(new NLPDate(null, 9, 22))],
            "on 22nd of september": [new NLPContainer(new NLPDate(null, 9, 22))],
            "tomorrow morning": [new NLPContainer(new NLPInterval(1, 'day'), new NLPTime(9, undefined, "am"))],
            "on friday the 23rd": [new NLPContainer(new NLPDate(null, null, 23))],
            "today": [new NLPContainer({})],
            "tomorrow afternoon": [new NLPContainer(new NLPInterval(1, 'day'), new NLPTime(3, undefined, "pm"))],
            "tonight": [new NLPContainer(undefined, new NLPTime(9, undefined, "pm"))],
            "tomorrow night": [new NLPContainer(new NLPInterval(1, 'day'), new NLPTime(9, undefined, "pm"))],
            "in an hour": [new NLPContainer(new NLPInterval(1, 'hour'))],
            "1 hour": [new NLPContainer(new NLPInterval(1, 'hour'))],
        };
        for (let key in map) {
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
            "on 02/03 at 3": [new NLPContainer(new NLPDate(null, null, null, 2, 3), new NLPTime(3))],
            "on 02/03 at 3, 4 pm and 5 am": [
                new NLPContainer(new NLPDate(null, null, null, 2, 3), new NLPTime(3, 0, "pm")),
                new NLPContainer(new NLPDate(null, null, null, 2, 3), new NLPTime(4, 0, "pm")),
                new NLPContainer(new NLPDate(null, null, null, 2, 3), new NLPTime(5, 0, "am")),
            ],
            "on 02/03/2019 at 3, 4 pm and 5 am": [
                new NLPContainer(new NLPDate(2019, null, null, 2, 3), new NLPTime(3, 0, "pm")),
                new NLPContainer(new NLPDate(2019, null, null, 2, 3), new NLPTime(4, 0, "pm")),
                new NLPContainer(new NLPDate(2019, null, null, 2, 3), new NLPTime(5, 0, "am")),
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
            "every 3 wednesdays, every 2 tuesdays at 4 pm": [
                new NLPContainer(new NLPInterval(3, "wednesdays"), new NLPTime(4, 0, "pm")),
                new NLPContainer(new NLPInterval(2, "tuesdays"), new NLPTime(4, 0, "pm")),
            ],
            "every 3 wednesdays, 2 tuesdays at 4 pm": [
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
            "tomorrow afternoon": [
                new NLPContainer(new NLPInterval(1, 'day'), new NLPTime(3, undefined, "pm"))
            ],
            "tonight": [
                new NLPContainer(undefined, new NLPTime(9, undefined, "pm"))
            ],
            "tomorrow night": [
                new NLPContainer(new NLPInterval(1, 'day'), new NLPTime(9, undefined, "pm"))
            ],
        };
        for (let key in map) {
            expect(utils.getNLPContainersFromReminderDateTimeText(key)).toEqual(map[key]);
        }
    });
});