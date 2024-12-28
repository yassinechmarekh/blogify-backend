const joi = require('joi');

const createCommentValidation = (obj) => {
    const schema = joi.object({
        postId: joi.required().messages({
            'any.required': `Post id is required !`
        }),
        content: joi.string().required().messages({
            'string.base': `Comment content should be a type of text !`,
            'any.required': `Comment content is required !`
        })
    });
    return schema.validate(obj);
}

const updateCommentValidaton = (obj) => {
    const schema = joi.object({
        content: joi.string().required().messages({
            'string.base': `Comment content should be a type of text !`,
            'any.required': `Comment content is required !`
        })
    });
    return schema.validate(obj);
}

module.exports = {createCommentValidation, updateCommentValidaton}