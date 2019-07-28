
const levenshtein = require('fast-levenshtein');

// word: word to be matched in the list
// list: list of words
// percentageThreshold: maximum lavenstein distance as a percentage of word length
//  otherwise null is returned
function autocorrect(word, list, percentageThreshold) {
    word = word.toUpperCase();
    let wordWithMinDistance = null;
    let minDistance = 999999;
    for(let w of list) {
        let d = levenshtein.get(word, w.toUpperCase());
        if(d < minDistance) {
            wordWithMinDistance = w;
            minDistance = d;
        }
    }
    console.log(minDistance, minDistance/word.length);
    if(minDistance / word.length > percentageThreshold) {
        return null;
    }

    return wordWithMinDistance;
}

module.exports = {
    autocorrect: autocorrect,  
};