const mongoose = require("mongoose");
const Schema   = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const Assignment = new Schema({
    instructor_id: { 
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
    deadline: {
        type: Date, required: true
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date }

});

module.exports = mongoose.model('Assignment', Assignment, "assignment");