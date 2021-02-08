const { reject } = require("async");
const constants = require("../../helper/constants");
const { ValidateFields } = require("../../helper/utils");

function createUserData(user) {
    let userData = {
        isLoggedIn: true,
        _id: user._id,
        email: user.email,
        name: user.name,
        subject: user.subject,
        role: "instructor"
    }
    return userData;
}

function addInstructorsDetails(request, data) {
    const options = {
        entity: constants.ENTITY_INSTRUCTORS,
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
            subject: data.subject
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

function getInstructorByEmail(request, email){
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

function getSubmission(request, _id){
    const options = {
        entity: constants.ENTITY_SUBMISSION,
        query: {
            filters: [
                {
                    field: "_id", value: _id, operator: "equals"
                }
            ]
        }
    }
    return request.app.list(options)
}

function gradeSubmissions(request, grade, _id){
    const options = {
        entity: constants.ENTITY_SUBMISSION,
        entity_id: _id,
        data: {
            grade: grade
        }
    }
    return request.app.edit(options)
}

class InstructorsCtrl {

    register(request){
        return new Promise((resolve, reject) => {
            const data = request.data
            if (!ValidateFields(["email", "password", "name", "subject"], data)) {
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
                return addInstructorsDetails(request, data)
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
            getInstructorByEmail(request, data.email)
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

    //  API to add addAssignment
    //  qustion is URL for the PDF generated from the multer upload API
    //
    addAssignment(request) {
        return new Promise((resolve, reject) => {
            const data = request.data
            if (!ValidateFields(["name", "subject", "question", "deadline"], data)) {
                return reject({ status: 406, error: constants.ERR_MISSING_FIELDS });
            }
            const options = {
                entity: constants.ENTITY_ASSIGNMENT,
                data: {
                    instructor_id: request.session.user._id,
                    name: data.name,
                    subject: data.subject,
                    question: data.question,
                    deadline: data.deadline
                }
            }
            request.app.add(options)
            .then(res => {
                resolve({status: 200, message: "Assignment Added"})
            })
            .catch(err =>{
                return reject({status: 406, error:err.error})
            })
        })
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
    
    gradeSubmissions(request) {
        return new Promise(async (resolve, reject) => {
            const data = request.data
            if (!ValidateFields(["submission_id", "grade"], data)) {
                return reject({ status: 406, error: constants.ERR_MISSING_FIELDS });
            }
            getSubmission(request, submission_id)
            .then(res => {
                if (res.data.records.length !== 1) 
                    return reject({ status: 406, error: "Submission does not exist"})
                if (typeof grade !== "number" || grade > 10 || grade < 0)
                    return reject({ status: 406, error: "Invalid Grade"})
                return gradeSubmissions(request, grade)
            })
            .then(res => {
                resolve({status: 200, message: "Grading done"})
            })
        });
    }
}

module.exports = new InstructorsCtrl();