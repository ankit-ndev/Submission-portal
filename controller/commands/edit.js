const mongoose = require("mongoose");

const utils = require("../../helper/utils");

class EditCtrl {
    constructor(request) {
        return new Promise((resolve, reject)=> {
            const entity = request.entity;
            const entityId = request.entity_id;

            if (!entity || !entityId) {
                return reject({ status: 406, error: "Mandatory Params Missing" })
            }

            if (!utils.isValidMongoId(entityId)) return reject({ status: 406, error: "Entity Id should be valid" }); // validate mongo Id

            let data = request.data;
            if (typeof data !== 'object') {
                try {
                    data = JSON.parse(data);
                } catch(e) {
                    return reject({ status: 406, error: "Invalid Request" });
                }
            }
            data.updated_at = new Date();
            const collection = require(`../../models/${entity}`);
            collection.updateOne({ _id: mongoose.Types.ObjectId(entityId) }, data, (err, response)=> {
                if (err) return reject({ status: 406, error: err });

                if (response.n === 0) return reject({ status: 406, error: "No Record Updated"});
                resolve({ status: 200, data: "Updated Successfully" });
            })
        });
    }
}

module.exports = EditCtrl;
