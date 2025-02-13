const joi = require("joi");

const createAuhtorValidation = (obj) => {
  const schema = joi.object({
    username: joi.string().trim().min(2).max(25).required().messages({
      "string.base": `Username should be a type of text`,
      "string.min": `Username must contain at least {#limit} characters.`,
      "string.max": `Username must not exceed {#limit} characters.`,
      "any.required": `Username is a required field`,
    }),
    email: joi.string().trim().min(5).max(100).required().email().messages({
      "string.base": `Email should be a type of text`,
      "string.min": `Email must contain at least {#limit} characters.`,
      "string.max": `Email must not exceed {#limit} characters`,
      "any.required": `Email is a required field`,
      "string.email": "Email must be valid.",
    }),
    password: joi.string().required().trim().min(8).messages({
      "stribg.base": `Password should be a type of text`,
      "any.required": `Password is a required field`,
      "string.min": `Password must contain at least {#limit} characters.`,
    }),
  });
  return schema.validate(obj);
};

const updateUserProfileValidation = (obj) => {
  const schema = joi.object({
    email: joi.string().trim().min(5).max(100).email().messages({
      "string.base": `Email should be a type of text !`,
      "string.min": `Email must contain at least {#limit} characters !`,
      "string.max": `Email must not exceed {#limit} characters !`,
      "string.email": "Email must be valid !",
    }),
    username: joi.string().trim().min(2).max(25).messages({
      "string.base": `Username should be a type of text !`,
      "string.min": `Username must contain at least {#limit} characters !`,
      "string.max": `Username must not exceed {#limit} characters !`,
    }),
    job: joi.string().min(2).max(50).messages({
      "string.base": `Job should be a type of text !`,
      "string.min": `Job must contain at least {#limit} characters !`,
      "string.max": `Job must not exceed {#limit} characters !`,
    }),
    bio: joi.string().messages({
      "string.base": `Bio should be a type of text !`,
    }),
    address: joi.string().messages({
      "string.base": `Address should be a type of text !`,
    }),
    socialLink: joi
      .object({
        facebook: joi.string().uri().allow(null).messages({
          "string.uri": "Facebook link must be a valid URL!",
        }),
        instagram: joi.string().uri().allow(null).messages({
          "string.uri": "Instagram link must be a valid URL!",
        }),
        twitter: joi.string().uri().allow(null).messages({
          "string.uri": "Twitter link must be a valid URL!",
        }),
        linkedin: joi.string().uri().allow(null).messages({
          "string.uri": "LinkedIn link must be a valid URL!",
        }),
      })
      .messages({
        "object.base": "socialLink should be a type of object!",
      }),
  });
  return schema.validate(obj);
};

const updateUserPasswordValidation = (obj) => {
  const schema = joi.object({
    email: joi.string().trim().min(5).max(100).email().optional().messages({
      "string.base": `Email should be a type of text !`,
      "string.min": `Email must contain at least {#limit} characters !`,
      "string.max": `Email must not exceed {#limit} characters !`,
      "string.email": "Email must be valid !",
    }),
    currentPassword: joi.required().messages({
      "any.required": `Your old password is required !`,
    }),
    newPassword: joi.string().required().min(8).messages({
      "stribg.base": `Your new password should be a type of text`,
      "any.required": `Your new password is required`,
      "string.min": `Your new password must contain at least {#limit} characters.`,
    }),
  });
  return schema.validate(obj);
}

module.exports = { createAuhtorValidation, updateUserProfileValidation, updateUserPasswordValidation };
