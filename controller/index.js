const mongoose = require("mongoose");

const ListCtrl       = require("./commands/list");
const GetCtrl        = require("./commands/get");
const AddCtrl        = require("./commands/add");
const EditCtrl       = require("./commands/edit");
const DeleteCtrl     = require("./commands/delete");
const CustomCtrl     = require("./commands/custom");
const AddManyCtrl    = require("./commands/addMany");
const UpdateManyCtrl = require("./commands/updateMany");
const CountCtrl      = require("./commands/count");
const DeleteAllCtrl  = require("./commands/deleteAll");
const HookCtrl       = require("./hooks");
const PermissionCtrl = require("./permission");
const utils          = require("../helper/utils");

function validateEntityName(entity) {
    return new Promise(async (resolve, reject)=> {
        const entities = await utils.getAllEntites();
        if (entities.indexOf(`${entity}`) === -1) return reject({ status: 406, error: "Invalid Entity Name" });
        else resolve();
    })
}


class EntityCtrl {

    call(command, request) {
        return new Promise(async (resolve, reject)=> {
            let response = {
                status: 200
            };
            try {
                await validateEntityName(request.entity);
                if (!this.ignorePermission) await PermissionCtrl.checkPermission(request.session.user, request.entity, request.command);
                this.ignorePermission = true;


                if (!request.query) request.query = {};
                request.app = new EntityCtrl();
                request.app.ignorePermission = true;
                if (typeof request.data === "string") request.data = JSON.parse(request.data);

                let executeHook = request.executeHook;

                if (executeHook) {
                    const preHookResponse = await HookCtrl.pre(request, command);
                    if (preHookResponse && preHookResponse.sent === true) {
                        response = preHookResponse.response;
                        return resolve(response);
                    }
                }


                switch (command) {
                    case 'list':
                        response = await new ListCtrl(request);
                        break;
                    case 'get':
                        response = await new GetCtrl(request);
                        break;
                    case 'add':
                        response = await new AddCtrl(request);
                        break;
                    case 'edit':
                        response = await new EditCtrl(request);
                        break;
                    case 'delete':
                        response = await new DeleteCtrl(request);
                        break;
                    case 'addMany':
                        response = await new AddManyCtrl(request);
                        break;
                    case "updateMany":
                        response = await new UpdateManyCtrl(request);
                        break;
                    case "count":
                        response = await new CountCtrl(request);
                        break;
                    case "deleteAll":
                        response = await new DeleteAllCtrl(request);
                        break;
                    case 'custom':
                        response = await new CustomCtrl(request);
                        break;

                }

                if (executeHook) {
                    const postHookResponse = await HookCtrl.post(request, response, command);
                    if (postHookResponse && postHookResponse.sent === true) {
                        response = postHookResponse.response;
                        return resolve(response);
                    }
                }

            } catch (e) {
                response = e;
                if (e instanceof Error) {
                    response = {
                        status: 500,
                        error: e.toString()
                    }
                }

            }
            return resolve(response);
        })
    }

    async list(request) {
        request.command = "list";
        return this.call("list", request);
    }

    async get(request) {
        request.command = "get";
        return this.call("get", request);
    }

    async add(request) {
        request.command = "add";
        return this.call("add", request);
    }

    async edit(request) {
        request.command = "edit";
        return this.call("edit", request);
    }

    async delete(request) {
        request.command = "delete";
        return this.call("delete", request);
    }

    async addMany(request) {
        request.command = "addMany";
        return this.call("addMany", request);
    }

    async updateMany(request) {
        request.command = "updateMany";
        return this.call("updateMany", request);
    }

    async count(request) {
        request.command = "count";
        return this.call("count", request);
    }

    async deleteAll(request) {
        request.command = "deleteAll";
        return this.call("deleteAll", request);
    }

    async customCommand(request) {
        return this.call("custom", request);
    }
}

module.exports = EntityCtrl;
