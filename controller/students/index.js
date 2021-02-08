const constants = require("../../helper/constants");
const { ValidateFields } = require("../../helper/utils");

function createUserData(user) {
    let userData = {
        isLoggedIn: true,
        _id: user._id,
        email: user.email,
        name: user.name,
        role: "student"
    }
    return userData;
}

function addStudentDetails(request, data) {
    const options = {
        entity: constants.ENTITY_STUDENT,
        data: {
            name: data.name,
            email: data.email,
            password: data.password
        }
    }
    return request.app.add(options)
}

function checkDuplicateEmail(request, email){
    const options = {
        entity: constants.ENTITY_STUDENT,
        query: {
            filters: [
                {
                    field: "email", value: email, operator: "equals"
                }
            ]
        }
    }
    return request.app.list(options)
}

function checkDuplicateEmail2(request, email){
    const options = {
        entity: constants.ENTITY_INSTRUCTORS,
        query: {
            filters: [
                {
                    field: "email", value: email, operator: "equals"
                }
            ]
        }
    }
    return request.app.list(options)
}

function getStudentByEmail(request, email){
    const options = {
        entity: constants.ENTITY_STUDENT,
        query: {
            filters: [
                {
                    field: "email", value: email, operator: "equals"
                }
            ]
        }
    }
    return request.app.list(options)
}

class StudentCtrl {

    register(request){
        return new Promise((resolve, reject) => {
            const data = request.data
            if (!ValidateFields(["email", "password", "name"], data)) {
                return reject({ status: 406, error: constants.ERR_MISSING_FIELDS });
            }
            checkDuplicateEmail(request, data.email)
            .then(res => {
                if (res.status !== 200) return reject({status: 406, error: "Something went wrong"})
                if (res.data.records.length !== 0) return reject({ status: 406, error: constants.ERR_DUPLICATE_EMAIL})
                return checkDuplicateEmail2(request, data.email)
            })
            .then(res => {
                if (res.status !== 200) return reject({status: 406, error: "Something went wrong"})
                if (res.data.records.length !== 0) return reject({ status: 406, error: constants.ERR_DUPLICATE_EMAIL})
                return addStudentDetails(request, data)
            })
            .then(res => {
                if(res.status === 200)
                return resolve({ status: 200, message: constants.MSG_REGISTER_SUCCESS})
                else
                return reject({ status: 406, error: res.error})
            })
            .catch(err =>{
                return reject({status: 406, error:err.error})
            })
        })
    }
    
    login(request){
        return new Promise((resolve, reject) => {
            const data = request.data
            if (!ValidateFields(["email", "password"], data)) {
                return reject({ status: 406, error: constants.ERR_MISSING_FIELDS });
            }
            getStudentByEmail(request, data.email)
            .then(res => {
                if (res.status !== 200) return reject({status: 406, error: "Something went wrong"})
                if (res.data.records.length === 0) return reject({ status: 406, error: constants.ERR_INVALID_CREDS})
                else {
                    if (data.password === res.data.records[0].password){
                        request.session.user =  createUserData(res.data.records[0])
                        return resolve({ status: 200, message: constants.MSG_LOGIN_SUCCESS});
                    }
                    else return reject({ status: 406, error: constants.ERR_INVALID_CREDS})
                }
            })
            .catch(err =>{
                return reject({status: 406, error:err.error})
            })
        })
    }

    logout(request) {
        return new Promise(async (resolve, reject) => {
            const { user } = request.session;
            if (!user.isLoggedIn) return reject({ status: 406, error: "Error while logout" })
            request.session.user = {
                isLoggedIn: false,
                role: "public",
            };
            request.session.save(() => {
                resolve({status: 200, message: "Logout success"});
            });
        });
    }

    viewAssignments(request) {
        return new Promise(async (resolve, reject) => {
            const options = {
                entity: constants.ENTITY_ASSIGNMENT
            }
            request.app.list(options)
            .then(res => {
                resolve(res)
            })
        });
    }
    
    viewSubmissions(request) {
        return new Promise(async (resolve, reject) => {
            const options = {
                entity: constants.ENTITY_SUBMISSION
            }
            request.app.list(options)
            .then(res => {
                resolve(res)
            })
        });
    }
}

module.exports = new StudentCtrl();