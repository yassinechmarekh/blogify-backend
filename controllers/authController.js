const User = require("../models/userModel");
const {
  registerValidation,
  loginValidation,
} = require("../utils/validations/authValidation");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

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

  // @TODO send email to verify account

  res
    .status(201)
    .json({ message: "You registred successfully, please log in" });
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

  // @TODO send email to verify account if not verified

  // generate token
  const token = user.generateAuthToken();

  res.status(200).json({
    userId: user._id,
    email: user.email,
    status: user.status,
    token: token,
  });
});
