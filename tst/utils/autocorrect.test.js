const autocorrect = require("../../utils/autocorrect.js");

describe("autocorrect", () => {
    it("should work", () => {
        const LIST_OF_WORDS = ["Asia/Katmandu", "PDT", "America/Los_Angeles"];
        let map = {
            "pdx": "PDT",
            "yyy": null,
            "America los angolos": "America/Los_Angeles",
            "katmandu": null
        };
        for(let key in map) {
            expect(autocorrect.autocorrect(key, LIST_OF_WORDS, 1/3)).toEqual(map[key]);
        }
    });
});