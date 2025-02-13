const joi = require('joi');

const addEmailToNewsLetterValidation = (obj) => {
    const schema = joi.object({
        email: joi.string().email().required().trim().min(5).max(100).message({
            'string.base': 'Email should be a type of text',
            'string.email': 'Invalid email format',
            'any.required': 'Email is a required field!',
            'string.min': 'Email must contain at least {#limit} characters!',
            'string.max': 'Email must not exceed {#limit} characters!',
        })
    });
    return schema.validate(obj);
};

module.exports = {addEmailToNewsLetterValidation}