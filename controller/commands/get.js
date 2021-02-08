const mongoose = require("mongoose");

const utils = require("../../helper/utils");


class GetCtrl {
    constructor(request) {
        return new Promise((resolve, reject)=> {
            const entity = request.entity;
            const entityId = request.entity_id;
            const query = request.query;

            if (!entity || !entityId) {
                return reject({ status: 406, error: "Mandatory Params Missing" })
            }

            if (!utils.isValidMongoId(entityId)) return reject({ status: 406, error: "Entity Id should be valid" }); // validate mongo Id

            if (!query.fields) query.fields = {};
            if (query.fields && typeof query.fields === 'string') {
                try {
                    query.fields = JSON.parse(query.fields);
                } catch (e) {
                    query.fields = {};
                }
            }

            const collection = require(`../../models/${entity}`);

            collection.findOne({ _id: mongoose.Types.ObjectId(entityId) }, query.fields, (err, patients)=> {
                if (err) return reject({ status: 406, error: err });

                resolve({ status: 200, data: patients });
            });
        });
    }
}


module.exports = GetCtrl;
