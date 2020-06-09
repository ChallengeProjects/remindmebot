const moment = require("moment-timezone");

function get2DigitFromInt(i) {
    i = "" + i;
    if (i.length == 1) {
        return "0" + i;
    } else {
        return i;
    }
}

function getTimezoneNameFromOffset(offset, depth=0) {
    offset = parseFloat(offset);
    let tzFormatted = "";
    tzFormatted += offset < 0 ? "-" : "+";
    offset = Math.abs(offset);
    tzFormatted += get2DigitFromInt(parseInt(offset));
    tzFormatted += ":";
    let fraction = offset - parseInt(offset);
    tzFormatted += get2DigitFromInt(fraction * 60);
    let matchList = moment.tz.names()
        .filter(tzName => moment.tz(tzName).format('Z') == tzFormatted);
    if (matchList.length) {
        return matchList[0];
    }
    else if (depth < 3) {
        return getTimezoneNameFromOffset(offset + 0.25, depth + 1) || getTimezoneNameFromOffset(offset - 0.25, depth + 1);
    }
    else {
        return null;
    }
}

module.exports = {
    getTimezoneNameFromOffset: getTimezoneNameFromOffset,
};