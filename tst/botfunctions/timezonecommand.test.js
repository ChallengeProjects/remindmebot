process.env["config"] = "tst/config.json";
const timezonecommand = require("../../botfunctions/timezonecommand.js");
describe("parseTimezone", () => {
    it("should work", () => {
        let map = {
            "Dubai": {
                parsedTimezone: "United Arab Emirates Dubai",
                timezoneForMoment: "Asia/Dubai",
            },
            // TODO
            "Kuala Lumpur, Malaysia": null,
            "Kolkata": {
                parsedTimezone: "India Kolkata",
                timezoneForMoment: "Asia/Kolkata",
            },
            "Europe Italy": {
                parsedTimezone: "Italy Potenza",
                timezoneForMoment: "Europe/Rome",
            },
            "Italy": {
                parsedTimezone: "Italy Potenza",
                timezoneForMoment: "Europe/Rome",
            },
            "Asia india": {
                parsedTimezone: "Indian Standard Time",
                timezoneForMoment: "Asia/Kolkata",
            },
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
                parsedTimezone: "Egypt Cairo",
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
            "Asia Beijing": {
                parsedTimezone: "China Beijing",
                timezoneForMoment: "Asia/Shanghai",
            },
        };
        for (let key in map) {
            expect(timezonecommand.parseTimezone(key)).toEqual(map[key]);
        }
    });
});