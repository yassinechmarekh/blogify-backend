const joi = require("joi");

const createCategoryValidation = (obj) => {
  const schema = joi.object({
    title: joi.string().min(2).max(50).required().messages({
      "string.base": `Category title should be a type of text !`,
      "string.min": `Category title must contain at least {#limit} characters !`,
      "string.max": `Category title must not exceed {#limit} characters !`,
      "any.required": `Category title is a required field !`,
    }),
    description: joi.string().min(10).required().messages({
      "string.base": `Category description should be a type of text !`,
      "string.min": `Category description must contain at least {#limit} characters !`,
      "any.required": `Category description is a required field !`,
    }),
    icon: joi.string().messages({
      "string.base": `Category description should be a type of text !`,
    }),
  });
  return schema.validate(obj);
};

const updateCategoryValidation = (obj) => {
  const schema = joi.object({
    title: joi.string().min(2).max(50).messages({
      "string.base": `Category title should be a type of text !`,
      "string.min": `Category title must contain at least {#limit} characters !`,
      "string.max": `Category title must not exceed {#limit} characters !`,
    }),
    description: joi.string().min(10).messages({
      "string.base": `Category description should be a type of text !`,
      "string.min": `Category description must contain at least {#limit} characters !`,
    }),
  });
  return schema.validate(obj);
};

module.exports = {createCategoryValidation, updateCategoryValidation}