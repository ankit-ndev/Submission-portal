//Every command must return promise
const commands = require("./customCommands");


class CustomCtrl {
    constructor(request) {
        return new Promise(async (resolve, reject)=> {
            const entity = request.entity;
            const command = request.command;
            if (!entity || !command) return reject({ status: 406, error: "Mandatory Params Missing" });

            if (!commands[entity]) return reject({ status: 406, error: "Invalid Entity Name" });
            if (!commands[entity][command]) return reject({ status: 406, error: "Invalid Command Name" });

            const func = commands[entity][command];
            func.call(module, request)
                .then((data)=> {
                    resolve(data);
                })
                .catch((err)=> {
                    reject(err);
                })
        });
    }
}


module.exports = CustomCtrl;
