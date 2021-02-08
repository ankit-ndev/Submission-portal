class AddManyCtrl {
    constructor(request) {
        return new Promise((resolve, reject)=> {
            const entity = request.entity;

            if (!entity) return reject({ status: 406, error: "Mandatory Params Missing" });

            let data = request.data;
            if (typeof data !== 'object') {
                try {
                    data = JSON.parse(data);
                } catch(e) {
                    return reject({ status: 406, error: "Invalid Request" });
                }
            }

            const Collection = require(`../../models/${entity}`);

            Collection.insertMany(data, (err, response)=> {
                if (err) return reject({ status: 406, error: err });
                resolve({ status: 200, data: "Inserted Successfully" })
            });
        })
    }
}

module.exports = AddManyCtrl;
