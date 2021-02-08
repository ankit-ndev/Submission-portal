const PreHook  = require("./pre");
const PostHook = require("./post");


function execute(request, command, hook) {
    return new Promise((resolve, reject)=> {
        const entity = request.entity;
        let func;
        switch (hook) {
            case "pre":
                if (!PreHook[entity] || !PreHook[entity][command]) return resolve();
                func = PreHook[entity][command];
                break;
            case "post":
                if (!PostHook[entity] || !PostHook[entity][command]) return resolve();

                func = PostHook[entity][command];
                break;
        }

        func.call(module, request)
            .then((data)=> {
                resolve(data);
            })
            .catch((err)=> {
                reject(err);
            });
    })
}

function executePost(request, response, command) {
    return new Promise((resolve, reject)=> {
        const entity = request.entity;
        if (!PostHook[entity] || !PostHook[entity][command]) return resolve();

        let func = PostHook[entity][command];
        func.call(module, request, response)
            .then((data)=> {
                resolve(data);
            })
            .catch((err)=> {
                reject(err);
            });
    })
}

class HookCtrl {
    pre(request, command) {
        return execute(request, command, "pre");
    }

    post(request, response, command) {
        return executePost(request, response, command);
    }
}

module.exports = new HookCtrl();
