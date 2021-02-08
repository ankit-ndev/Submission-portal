const mongoose = require("mongoose");

const { isValidMongoId } = require("../../helper/utils");

function parsedFilterValue(filter) {
    if (filter.field === '_id' && filter.value && typeof filter.value === 'string') {
        if (isValidMongoId(filter.value)) filter.value = mongoose.Types.ObjectId(filter.value);
        else return
    }
    let value = '';
    switch (filter.operator) {
        case 'equal':
            value = filter.value;
            break;
        case 'less_than':
            value = { $lt: filter.value };
            break;
        case 'less_than_or_equal':
            value = { $lte: filter.value };
            break;
        case 'greater_than':
            value = { $gt: filter.value };
            break;
        case 'greater_than_or_equal':
            value = { $gte: filter.value };
            break;
        case 'not_equal':
            value = {$ne: filter.value};
            break;
        case 'regex':
            value = {$regex: `.*${filter.value}.*`, $options: 'i'};
            break;
        case 'exists':
            const exists = (filter.value === "true");
            value = { $exists: exists };
            break;
        case "in":
            value = { $in: filter.value };
            break;
        default:
            value = filter.value;
    }

    return value;
}

function handleQuery(query) {
    const filters = {};

    if (query.filters) {
        if (typeof query.filters === "string") {
            try {
                query.filters = JSON.parse(query.filters);
            } catch (e) {
                query.filters = [];
            }
        }
        if (!query.filter_operator) query.filter_operator = "and";

        if (Array.isArray(query.filters) && query.filters.length) {
            switch(query.filter_operator) {
                case "or":
                    filters["$or"] = [];
                    for (let i = 0; i < query.filters.length; i++) {
                        const filter = query.filters[i];
                        if (!(filter.field && filter.field !== "")) continue;
                        const parseValue = parsedFilterValue(filter);
                        if (!parseValue) continue;
                        filters["$or"].push({
                            [filter.field]: parseValue
                        })
                    }
                    break;
                default:
                    filters["$and"] = [];
                    for (let i = 0; i < query.filters.length; i++) {
                        const filter = query.filters[i];
                        if (!(filter.field && filter.field !== "")) continue;
                        const parseValue = parsedFilterValue(filter);
                        if (!parseValue) continue;
                        filters["$and"].push({
                            [filter.field]: parseValue
                        })
                    }

            }
        }
    }

    return filters;
}

class UpdateManyCtrl {
    constructor(request) {
        return new Promise((resolve, reject)=> {
            const entity = request.entity;

            if (!entity) return reject({ status: 406, error: "Mandatory Params Missing" });
            let filters = {};
            if (request.query) {
                filters = handleQuery(request.query);
            }

            let data = request.data;
            if (typeof data !== 'object') {
                try {
                    data = JSON.parse(data);
                } catch(e) {
                    return reject({ status: 406, error: "Invalid Request" });
                }
            }

            const Collection = require(`../../models/${entity}`);
            Collection.updateMany(filters, data, (err, response)=> {
                if (err) return reject({ status: 406, error: err });
                resolve({ status: 200, data: "Updated Successfully" })
            });
        })
    }
}

module.exports = UpdateManyCtrl;
