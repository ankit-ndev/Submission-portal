const entities = [
    "students",
    "instructors",
    "assignment",
    "submission"
];

function getAllEntites() {
    return new Promise((resolve, reject)=> {
       resolve(entities);
    });
}

function isValidMongoId(id) {
    if (!id) return false;

    if (typeof id === 'string') {
        const checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
        return checkForHexRegExp.test(id);
    }

    if (typeof id === 'object') {
        return isValidMongoId(String(id));
    }

    return false;
}

function ValidateFields(mandatoryFields, data) {
    let isValid = true;
    mandatoryFields.forEach((field)=> {
        if (typeof data[field] === "undefined"){
            isValid = false;
        }
    });

    return isValid;
}

module.exports = {
    getAllEntites,
    isValidMongoId,
    ValidateFields
};
