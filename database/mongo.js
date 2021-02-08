const mongoose = require("mongoose");
const nconf    = require("nconf");

class MongoCtrl {

    connect() {
        return new Promise(async (resolve, reject)=> {
            let db = nconf.get("db").mongo;
            const environment = nconf.get("environment");
            mongoose.Promise = global.Promise;
            mongoose.set('useCreateIndex', true);
            if (environment === "dev") mongoose.set('debug', true);

            let url = `mongodb://${db.uri}:${db.port}/${db.name}`;

            mongoose.connect(url, db.options)
                .then(()=> { resolve(); })
                .catch(err=> { reject(err); });
        })
    }

    clearDatabase() {
        return new Promise(async (resolve, reject)=> {
            const collections = mongoose.connection.collections;

            for (const key in collections) {
                const collection = collections[key];
                await collection.deleteMany();
            }
            resolve();
        })
    }

}

module.exports = new MongoCtrl();
