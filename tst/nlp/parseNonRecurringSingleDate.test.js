const parseNonSingleRecurringDate = require('../../nlp/parseNonRecurringSingleDate.js');
const TIMEZONE = "America/Los_Angeles";
describe("_getDateTextFromOrdinal", () => {
    it('should work', () => {
        let map = {
            'on the 24th of january': 'on january 24',
            'on january the 24th': 'on january 24',
            'on march 30': 'on march 30',
            'on 30 march': 'on march 30',
        };
        
        for(let key in map) {
            expect(parseNonSingleRecurringDate._getDateTextFromOrdinal(key, TIMEZONE)).toEqual(map[key]);
        }
    });
});