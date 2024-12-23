const Joi = require("joi");

const registerValidation = (obj) => {
  const schema = Joi.object({
    username: Joi.string().trim().min(2).max(25).messages({
      "string.base": `Username should be a type of text`,
      "string.min": `Username must contain at least {#limit} characters.`,
      "string.max": `Username must not exceed {#limit} characters.`,
      "any.required": `Username is a required field`,
    }),
    email: Joi.string().trim().min(5).max(100).required().email().messages({
      "string.base": `Email should be a type of text`,
      "string.min": `Email must contain at least {#limit} characters.`,
      "string.max": `Email must not exceed {#limit} characters`,
      "any.required": `Email is a required field`,
      "string.email": "Email must be valid.",
    }),
    password: Joi.string().required().trim().min(8).messages({
      "stribg.base": `Password should be a type of text`,
      "any.required": `Password is a required field`,
      "string.min": `Password must contain at least {#limit} characters.`,
    }),
  });
  return schema.validate(obj);
};

const loginValidation = (obj) => {
  const schema = Joi.object({
    email: Joi.string().trim().min(5).max(100).required().email().messages({
      "string.base": `Email should be a type of text`,
      "string.min": `Email must contain at least {#limit} characters.`,
      "string.max": `Email must not exceed {#limit} characters`,
      "any.required": `Email is a required field`,
      "string.email": "Email must be valid.",
    }),
    password: Joi.string().required().trim().min(8).messages({
      "stribg.base": `Password should be a type of text`,
      "any.required": `Password is a required field`,
      "string.min": `Password must contain at least {#limit} characters.`,
    }),
  });
  return schema.validate(obj);
};

module.exports = { registerValidation, loginValidation };
