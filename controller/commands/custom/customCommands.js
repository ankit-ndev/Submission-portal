module.exports = {
    "students": {
        "register": async request=> require("../../students").register(request),
        "login": async request=> require("../../students").login(request),
        "logout": async request=> require("../../students").logout(request),
        "viewAssignments": async request=> require("../../students").viewAssignments(request),
        "viewSubmissions": async request=> require("../../students").viewSubmissions(request),
    },
    "instructors": {
        "register": async request=> require("../../instructors").register(request),
        "login": async request=> require("../../instructors").login(request),
        "logout": async request=> require("../../instructors").logout(request),
        "addAssignment": async request=> require("../../instructors").addAssignment(request),
        "viewSubmissions": async request=> require("../../instructors").viewSubmissions(request),
        "gradeSubmission": async request=> require("../../instructors").gradeSubmission(request),
    }
};
