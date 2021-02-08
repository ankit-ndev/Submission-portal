const mongoose = require("mongoose");

class DeleteAllCtrl {
    constructor(request) {
        return new Promise((resolve, reject)=> {
            const entity = request.entity;

            if (!entity) {
                return reject({ status: 406, error: "Mandatory Params Missing" })
            }

            const collection = require(`../../models/${entity}`);

            collection.deleteMany({}, (err, response)=> {
                if (err) return reject({ status: 406, error: err });
                resolve({ status: 200, data: "Deleted Successfully" });
            })

        });
    }
}

module.exports = DeleteAllCtrl;
