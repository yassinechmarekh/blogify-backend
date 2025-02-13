const User = require("../models/userModel");
const {
  registerValidation,
  loginValidation,
  forgetPasswordValidation,
  resetPasswordValidation,
} = require("../utils/validations/authValidation");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const VerificationToken = require("../models/verificationTokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

/**----------------------------------------
 * @desc Register new user
 * @route /api/auth/register
 * @method POST
 * @access public  
 -----------------------------------------*/
module.exports.registerController = asyncHandler(async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ message: "Your email is already exist !" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });
  await user.save();

  // create a new verification token
  const verificationToken = new VerificationToken({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex"),
  });
  await verificationToken.save();
  // make the link
  const link = `${process.env.CLIENT_DOMAIN}/${user._id}/verify/${verificationToken.token}`;
  // make the htmlTemplate
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
        <h3 style="color: #333;">Hello ${user.username.toUpperCase()},</h3>
        <p style="color: #555; font-size: 16px;">
          Thank you for registering on <strong>Blogify</strong>! Please click the button below to verify your email address.
        </p>
        <a href="${link}" 
          style="display: inline-block; background-color: #514DCC; color: white; text-decoration: none; 
                  padding: 12px 20px; font-size: 16px; border-radius: 5px; margin-top: 10px;">
          Verify Email
        </a>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #777; font-size: 14px;">Best regards,<br><strong>Blogify Team</strong></p>
      </div>
    </div>
  `;
  // send the email to verify account
  await sendEmail(user.email, "Blogify - Verify your email !", htmlTemplate);

  res.status(201).json({
    message: "We sent to you an email. Please verify your email address.",
  });
});

/**----------------------------------------
 * @desc Login User
 * @route /api/auth/login
 * @method POST
 * @access public  
 -----------------------------------------*/
module.exports.loginController = asyncHandler(async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password !" });
  }

  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordMatch) {
    return res.status(400).json({ message: "Invalid email or password !" });
  }

  if (!user.isAccountVerified) {
    let verificationToken = await VerificationToken.findOne({
      userId: user._id,
    });
    if (!verificationToken) {
      verificationToken = new VerificationToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      });
      await verificationToken.save();
    }

    const link = `${process.env.CLIENT_DOMAIN}/${user._id}/verify/${verificationToken.token}`;

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
          <h3 style="color: #333;">Hello ${user.username.toUpperCase()},</h3>
          <p style="color: #555; font-size: 16px;">
            Thank you for registering on <strong>Blogify</strong>! Please click the button below to verify your email address.
          </p>
          <a href="${link}" 
            style="display: inline-block; background-color: #514DCC; color: white; text-decoration: none; 
                    padding: 12px 20px; font-size: 16px; border-radius: 5px; margin-top: 10px;">
            Verify Email
          </a>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #777; font-size: 14px;">Best regards,<br><strong>Blogify Team</strong></p>
        </div>
      </div>
    `;

    await sendEmail(user.email, "Blogify - Verify your email !", htmlTemplate);

    return res.status(400).json({
      message: "We sent to you an email. Please verify your email address.",
    });
  }

  // generate token
  const token = user.generateAuthToken();

  res.status(200).json({
    userId: user._id,
    username: user.username,
    email: user.email,
    profilePhoto: user.profilePhoto.url,
    status: user.status,
    token: token,
  });
});

/**----------------------------------------
 * @desc Verify user account
 * @route /api/auth/:userId/verify/:token
 * @method GET
 * @access public  
 -----------------------------------------*/
module.exports.verifyUserAccountController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({ message: "Invalid link !" });
  }

  const verificationToken = await VerificationToken.findOne({
    userId: req.params.userId,
    token: req.params.token,
  });

  if (!verificationToken) {
    return res.status(400).json({ message: "Invalid link !" });
  }

  user.isAccountVerified = true;
  await user.save();

  await verificationToken.deleteOne();

  res.status(200).json({ message: "Your account is verified successfully !" });
});

/**----------------------------------------
 * @desc forget password : sent email to reset the password
 * @route /api/auth/forget-password
 * @method POST
 * @access public  
 -----------------------------------------*/
module.exports.forgetPasswordController = asyncHandler(async (req, res) => {
  const { error } = forgetPasswordValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res
      .status(400)
      .json({ message: "User with given email does not exist !" });
  }

  let verificationToken = await VerificationToken.findOne({ userId: user._id });
  if (!verificationToken) {
    verificationToken = new VerificationToken({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
    await verificationToken.save();
  }

  const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user._id}/${verificationToken.token}`;

  const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
          <h3 style="color: #333;">Hello ${user.username.toUpperCase()},</h3>
          <p style="color: #555; font-size: 16px;">
          We received a request to reset your password. If this was you, click the button below to create a new password.
          </p>
          <a href="${link}" 
            style="display: inline-block; background-color: #514DCC; color: white; text-decoration: none; 
                    padding: 12px 20px; font-size: 16px; border-radius: 5px; margin-top: 10px;">
            Reset Password
          </a>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #777; font-size: 14px;">Best regards,<br><strong>Blogify Team</strong></p>
        </div>
      </div>
    `;

  await sendEmail(user.email, "Blogify - Reset Password", htmlTemplate);

  res.status(200).json({
    message: {
      title: "Check your email to reset password.",
      description:
        "Password reset link sent to your email. Please check your inbox!",
    },
  });
});

/**----------------------------------------
 * @desc Get reset password link: validate link to reset password
 * @route /api/auth/reset-password/:userId/:token
 * @method GET
 * @access public  
 -----------------------------------------*/
module.exports.getResetPasswordController = asyncHandler(async (req, res) => {
  const { userId, token } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({ message: "Invalid link !" });
  }

  const verificationToken = await VerificationToken.findOne({
    userId: userId,
    token: token,
  });
  if (!verificationToken) {
    return res.status(400).json({ message: "Invalid link !" });
  }

  res.status(200).json({ message: "Valid Link !" });
});

/**----------------------------------------
 * @desc Rest password
 * @route /api/auth/reset-password/:userId/:token
 * @method POST
 * @access public  
 -----------------------------------------*/
module.exports.resetPasswordController = asyncHandler(async (req, res) => {
  const { userId, token } = req.params;

  const { error } = resetPasswordValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({ message: "Invalid link !" });
  }

  const verificationToken = await VerificationToken.findOne({
    userId: userId,
    token: token,
  });
  if (!verificationToken) {
    return res.status(400).json({ message: "Invalid link !" });
  }

  if (!user.isAccountVerified) {
    user.isAccountVerified = true;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  user.password = hashedPassword;
  await user.save();
  await verificationToken.deleteOne();

  res.status(200).json({
    message: {
      title: "Password updated.",
      description: "Password reset successfully, please log in!",
    },
  });
});
