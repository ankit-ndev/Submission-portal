const permissions = require("./permission.json");

class PermissionCtrl {
    checkPermission(user, entity, command) {
        return new Promise((resolve, reject)=> {
            try {
                if (user.role === "superadmin") return resolve();
                let roles = [];
                if (permissions[entity] && permissions[entity][command] && permissions[entity][command].roles) {
                    roles = permissions[entity][command].roles;
                }
                if (roles.indexOf(user.role) === -1) return reject({ status: 401, error: "Unauthorized" });
                else resolve();
            } catch(e) {
                return reject({ status: 406, error: "Invalid Entity or Command name" });
            }
        });
    }
}

module.exports = new PermissionCtrl();
