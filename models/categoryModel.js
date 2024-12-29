const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlenght: 2,
        maxlenght: 50
    },
    slug: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        minlenght: 10,
    },
    image: {
        type: Object,
        default: {
            url: '',
            publicId: null
        }
    },
    icon: {
        type: String
    }
},{timestamps: true});

const categoryModel = mongoose.model('category', categorySchema);

module.exports = categoryModel;