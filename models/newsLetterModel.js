const mongoose = require('mongoose');

const newsLetterSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minLength: 5,
        maxLength: 100
    },
    notification: {
        type: Boolean,
        default: true
    }
}, {timestamps: true});

const newsLetterModel = mongoose.model('newsletter', newsLetterSchema);

module.exports = newsLetterModel;