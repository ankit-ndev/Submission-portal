const mongoose = require("mongoose");

const utils = require("../../helper/utils");

class DeleteCtrl {
    constructor(request) {
        return new Promise((resolve, reject)=> {
            const entity = request.entity;
            const entityId = request.entity_id;

            if (!entity || !entityId) {
                return reject({ status: 406, error: "Mandatory Params Missing" })
            }

            if (!utils.isValidMongoId(entityId)) return reject({ status: 406, error: "Entity Id should be valid" }); // validate mongo Id

            const collection = require(`../../models/${entity}`);


            collection.findOneAndDelete({_id: entityId}, (err, patients)=> {
                if (err) return reject({ status: 406, error: err });

                resolve({ status: 200, data: "Deleted Successfully" });
            });
        });
    }
}

module.exports = DeleteCtrl;
