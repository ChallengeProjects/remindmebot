const { NLPContainer, NLPInterval } = require("../../nlp/models/date.js"),
    timemachine = require("../../timemachine.js");

const DATE_FORMAT = "MM/DD/YYYY:HH:mm";
const TIME_ZONE = "America/Los_Angeles";
const TODAY_DATE_STRING = "June 3, 2018 12:00:00"; // string to be used in timemachine (Thats a sunday)
/**
 * 06/03: Sunday, 06/04: Monday, 06/05: Tuesday,
 * 06/06: Wednesday 06/07: Thursday, 06/08: Friday,
 * 06/09: Saturday
 */

describe("NLPContainer.getMomentDate", () => {
    it("should work", () => {
        let nlpContainer = new NLPContainer(new NLPInterval(1, 'hour'));
        timemachine.config({ dateString: TODAY_DATE_STRING });
        expect(nlpContainer.getMomentDate(TIME_ZONE).format(DATE_FORMAT)).toEqual("06/03/2018:13:00");
        timemachine.reset();
    });
});