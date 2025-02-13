const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    token: {
        type: String,
        required: true
    }
}, {timestamps: true});

const verificationToken = mongoose.model('VerificationToken', verificationTokenSchema);

module.exports = verificationToken;