const FRANCO_ARAB_REMINDME_VARIANTS = [
    'fakarny', 'fakrny', 'fkarny', 'fkrny',
    'fakarney', 'fakrney', 'fkraney', 'fkrney',
    'fakarni', 'fakrni', 'fkrani', 'fkrni',
    'fakarnei', 'fakrnei', 'fkrnaei', 'fkrnei',
];

const USER_ERROR_MESSAGES = {
    GENERIC_INVALID_REMINDER: "Sorry, I wasn't able to understand.\nRemember the command is /remindme [in/on/at] [some date/time] to [something].\n<b>Note: date comes BEFORE the reminder text and not after</b>.\nYou can also try /help.",
};

module.exports = {
    FRANCO_ARAB_REMINDME_VARIANTS: FRANCO_ARAB_REMINDME_VARIANTS,
    USER_ERROR_MESSAGES: USER_ERROR_MESSAGES,
};