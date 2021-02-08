const mongoose = require("mongoose");
const Schema   = mongoose.Schema;
const validator = require("validator");

const Instructors = new Schema({
    name: { 
        type: String, required: true, trim: true,
        validate(val) {
            if(!validator.isAlpha(val)){
                throw new Error('Name cannot contain numbers or special characters');
            }
        }
    },
    email: {
        type: String, required: true, trim: true,
        validate(val) {
            if(!validator.isEmail(val)){
                throw new Error('Enter a valid email address.');
            }
        }
    },
    password: {
        type: String, required: true, trim: true
    },
    subject: {
        type: String, required: true, trim: true
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date }

});

module.exports = mongoose.model('Instructors', Instructors, "instructors");