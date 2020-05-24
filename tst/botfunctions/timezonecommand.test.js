const timezonecommand = require("../../botfunctions/timezonecommand.js");
describe("_parseTimezone", () => {
    it("should work", () => {
        let map = {
            "india": {
                parsedTimezone: "Indian Standard Time",
                timezoneForMoment: "Asia/Kolkata",
            },
            "PDT": {
                parsedTimezone: "PDT",
                timezoneForMoment: "US/Pacific-New",
            },
            "hamada": null,
            "Africa cairo": {
                parsedTimezone: "Africa/Cairo",
                timezoneForMoment: "Africa/Cairo",
            },
            "Chicago": {
                parsedTimezone: "United States of America Chicago",
                timezoneForMoment: "America/Chicago",
            },
            "Beijing": {
                parsedTimezone: "China Beijing",
                timezoneForMoment: "Asia/Shanghai",
            },
            "China Beijing": {
                parsedTimezone: "China Beijing",
                timezoneForMoment: "Asia/Shanghai",
            },
            "Pakistan": {
                parsedTimezone: "Pakistan Parachinar",
                timezoneForMoment: "Asia/Karachi",
            },
            "Moscow": {
                parsedTimezone: "Russia Moscow",
                timezoneForMoment: "Europe/Moscow",
            },
            // Shouldn't happen but all we have now unfortunately
            // maybe try splitting string and testing if each one is a city?
            "Asia Beijing": null,
        };
        for (let key in map) {
            expect(timezonecommand._parseTimezone(key)).toEqual(map[key]);
        }
    });
});