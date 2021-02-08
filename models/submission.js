const mongoose = require("mongoose");
const Schema   = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const Submission = new Schema({
    assignment_id: { 
        type: ObjectId, required: true 
    },
    instructor_id: { 
        type: ObjectId, required: true 
    },
    student_id: { 
        type: ObjectId, required: true 
    },
    name: { 
        type: String, required: true, trim: true
    },
    subject: {
        type: String, required: true, trim: true
    },
    question: {
        type: String, required: true, trim: true
    },
    response: {
        type: String, required: true, trim: true
    },
    deadline: {
        type: Date, required: true
    },
    grade: {
        type: Number, required: true
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date }

});

module.exports = mongoose.model('Submission', Submission, "submission");