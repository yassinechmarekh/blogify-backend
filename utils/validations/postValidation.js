const joi = require('joi');

const createPostValidation = (obj) => {
    const schema = joi.object({
        title: joi.string().min(2).max(200).required().messages({
            "string.base": `Title should be a type of text !`,
            "string.min": `Title must contain at least {#limit} characters !`,
            "string.max": `Title must not exceed {#limit} characters !`,
            "any.required": `Title is a required field !`
        }),
        content: joi.string().min(10).required().messages({
            "string.base": `Blog content should be a type of text !`,
            "string.min": `Blog content must contain at least {#limit} characters !`,
            "anu.required": `Blog content is a required field !`
        }),
        category: joi.required().messages({
            "any.required": `Category is a required field !`
        }),
    });
    return schema.validate(obj);
}

const updatePostValidation = (obj) => {
    const schema = joi.object({
        title: joi.string().min(2).max(200).messages({
            "string.base": `Title should be a type of text !`,
            "string.min": `Title must contain at least {#limit} characters !`,
            "string.max": `Title must not exceed {#limit} characters !`,
        }),
        content: joi.string().min(10).messages({
            "string.base": `Blog content should be a type of text !`,
            "string.min": `Blog content must contain at least {#limit} characters !`,
        }),
        category: joi.string().messages({
            "string.base": `Category should be a type of text !`
        }),
    });
    return schema.validate(obj);
}

module.exports = {createPostValidation, updatePostValidation}