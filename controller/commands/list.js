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
    const options = {
        skip: (query.skip === undefined) ? 0 : query.skip,
        limit: (query.limit === undefined) ? 50 : query.limit,

    };
    const filters = {};
    const fields = {};
    let resolve_keys = [];
    if (query.fields) {
        if (typeof query.fields === "string") {
            try {
                query.fields = JSON.parse(query.fields);
            } catch (e) {
                query.fields = {};
            }
        }

        const keys = Object.keys(query.fields);

        keys.forEach((key)=> {
            if (query.fields[key] == '1') fields[key] = 1;
            else if (query.fields[key] == '0' && key === "_id") fields[key] = 0
        });
    }

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
                        if (typeof parseValue === "undefined") continue;
                        filters["$and"].push({
                            [filter.field]: parseValue
                        })
                    }

            }
        }
    }

    if (query.start && !isNaN(query.start)) {
        options['skip'] = parseInt(query.start);
    }

    if (query.limit && !isNaN(query.limit)) {
        options['limit'] = parseInt(query.limit);
    }

    if (query.resolve) {
        try {
            if (typeof query.resolve === "string") query.resolve = JSON.parse(query.resolve);
            if (Array.isArray(query.resolve))
                query.resolve.forEach(res=> {
                    if (res.entity && res.fields && res.key) resolve_keys.push(res);
                })
        } catch (e) {
            // do nothing
        }
    }
    options['sort'] = { _id: -1 };

    if (query.sort) {
        options["sort"] = query.sort;
    }

    return {
        options,
        filters,
        fields,
        resolve_keys,
        skip_count: query.skip_count === true
    }
}

function listRecords(request, entity, fields, data) {
    return new Promise((resolve, reject)=> {
        const options = {
            entity,
            query: {
                filters:[
                    { field: "_id", value: data, operator: "in" }
                ],
                fields
            },
            executeHook: false,
            session: {
                user: {
                    role: "superadmin"
                }
            }
        };
        request.app.list(options)
            .then((response)=> {
                if (response.status !== 200) return reject();
                if (!response.data || !response.data.records || !Array.isArray(response.data.records)) return reject();
                resolve(response.data.records);
            })
            .catch((err)=> {
                reject(err);
            })
    })
}

function resolveRecords(request, resolve_keys, records) {
    return new Promise(async (resolve, reject)=> {
        if (!resolve_keys.length) return resolve(records);
        for (let i = 0; i< resolve_keys.length; i++) {
            const resolve_key = resolve_keys[i];
            const key = resolve_key.key;
            const data = [];
            records.forEach((record)=> {
                record = JSON.parse(JSON.stringify(record));
                if (record[key] && data.indexOf(record[key]) === -1) data.push(record[key]);
            });
            if (!data.length) continue;
            try {
                let resolve_records = await listRecords(request, resolve_key.entity, resolve_key.fields, data);
                let resolved = {};
                resolve_records.forEach((record)=> {
                    record = JSON.parse(JSON.stringify(record));
                    resolved[record._id] = record;
                });
                for (let j = 0; j < records.length; j++) {
                    const record = JSON.parse(JSON.stringify(records[j]));
                    record[key] = resolved[record[key]];
                    records[j] = record;
                }

            } catch(e) {

            }
        }
        resolve(records);
    })
}

class ListCtrl {
    constructor(request) {
        return new Promise((resolve, reject)=> {
            const entity = request.entity;
            let fields, options, filters, resolve_keys = [];
            let skip_count = false;
            if (request.query) {
                const query = handleQuery(request.query);
                options = query.options;
                filters = query.filters;
                fields = query.fields;
                skip_count = query.skip_count === true;
                resolve_keys = query.resolve_keys;
            }
            const collection = require(`../../models/${entity}`);
            collection.find(filters, fields, options, async (err, records)=> {
                if (err) return reject({ status: 406, error: err });
                if (resolve_keys.length) records = await resolveRecords(request, resolve_keys, records);
                if (skip_count) return resolve({ status: 200, data: { records: records, total: records.length }});
                collection.countDocuments(filters, (err, count)=> {
                    resolve({ status: 200, data: { records: records, total: count }  });
                })
            });
        })
    }
}


module.exports = ListCtrl;
