const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require('fs');
const User = require("../models/userModel");
const {
  createAuhtorValidation,
  updateUserProfileValidation,
  updateUserPasswordValidation,
} = require("../utils/validations/userValidation");
const {
  cloudinaryUploadImage,
  cloudinarydeleteImage,
} = require("../utils/cloudinary");

/**----------------------------------------
 * @desc Get all users
 * @route /api/users/profile
 * @method GET
 * @access private  (only admin)
 -----------------------------------------*/
module.exports.getAllUsersController = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json(users);
});

/**----------------------------------------
 * @desc Get all auhtors
 * @route /api/users/authors
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getAllAuthorsController = asyncHandler(async (req, res) => {
  const authors = await User.find({ status: "author" }).select("-password");
  res.status(200).json(authors);
});

/**----------------------------------------
 * @desc Get all readers
 * @route /api/users/readers
 * @method GET
 * @access private (only admin)
 -----------------------------------------*/
module.exports.gettAllReadersController = asyncHandler(async (req, res) => {
  const readers = await User.find({ status: "reader" }).select("-password");
  res.status(200).json(readers);
});

/**----------------------------------------
 * @desc Get count of auhtors
 * @route /api/users/authors/count
 * @method GET
 * @access private (only admin)
 -----------------------------------------*/
module.exports.getCountAuthorsController = asyncHandler(async (req, res) => {
  const authorsCount = await User.find({ status: "author" }).countDocuments();
  res.status(200).json({ count: authorsCount });
});

/**----------------------------------------
 * @desc Get count of readers
 * @route /api/users/readers/count
 * @method GET
 * @access private (only admin)
 -----------------------------------------*/
module.exports.getCountReadersController = asyncHandler(async (req, res) => {
  const readersCount = await User.find({ status: "reader" }).countDocuments();
  res.status(200).json({ count: readersCount });
});

/**----------------------------------------
 * @desc Get specific user
 * @route /api/users/profile/:id
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getUserController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").populate('posts');
  if (!user) {
    return res.status(404).json({ message: "User not found !" });
  }
  res.status(200).json({ user });
});

/**----------------------------------------
 * @desc Create new author
 * @route /api/users/authors
 * @method POST
 * @access private (only admin)
 -----------------------------------------*/
module.exports.createAuthorController = asyncHandler(async (req, res) => {
  const { error } = createAuhtorValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ message: "This email already exist !" });
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  user = new User({
    email: req.body.email,
    password: req.body.password,
    status: "author",
  });
  await user.save();

  res.status(201).json({ message: "Author created successfully !" });
});

/**----------------------------------------
 * @desc Update User Profile
 * @route /api/users/profile/:id
 * @method PUT
 * @access private (only user himself)
 -----------------------------------------*/
module.exports.updateUserProfileController = asyncHandler(async (req, res) => {
  const { error } = updateUserProfileValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        email: req.body.email,
        username: req.body.username,
        job: req.body.job,
        bio: req.body.bio,
        address: req.body.address,
        "socialLink.facebook": req.body.socialLink?.facebook,
        "socialLink.instagram": req.body.socialLink?.instagram,
        "socialLink.twitter": req.body.socialLink?.twitter,
        "socialLink.linkedin": req.body.socialLink?.linkedin,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res.status(200).json(updatedUser);
});

/**----------------------------------------
 * @desc Update User Password
 * @route /api/users/password/:id
 * @method PUT
 * @access private (only user himself)
 -----------------------------------------*/
module.exports.updateUserPasswordController = asyncHandler(async (req, res) => {
  const { error } = updateUserPasswordValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  let user = await User.findById(req.params.id);
  if(!user){
    return res.status(404).json({message: 'User not found !'});
  }
  const passwordIsMatch = await bcrypt.compare(
    req.body.oldPassword,
    user.password
  );
  if (!passwordIsMatch) {
    return res.status(400).json({ message: "Your old password is incorrect!" });
  }

  const salt = await bcrypt.genSalt(10);
  req.body.newPassword = await bcrypt.hash(req.body.newPassword, salt);

  user.password = req.body.newPassword;
  await user.save();

  res.status(200).json({ message: "Password updated successfully!" });
});

/**----------------------------------------
 * @desc Upload profile photo
 * @route /api/users/profile/upload-profile-photo
 * @method POST
 * @access private (only logged in user)
 -----------------------------------------*/
module.exports.uploadProfilePhotoController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ mesage: "No file provieded !" });
  }
  
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  
  const result = await cloudinaryUploadImage(imagePath);
  
  const user = await User.findById(req.user.id);
  
  if (user.profilePhoto.publicId !== null) {
    await cloudinarydeleteImage(user.profilePhoto.publicId);
  }
  
  user.profilePhoto = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  await user.save();
  
  res.status(200).json({
    message: "Your profile photo uploaded successfully !",
    profilePhoto: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });
  
  fs.unlinkSync(imagePath);
});

/**----------------------------------------
 * @desc Delete user profile
 * @route /api/users/profile/:id
 * @method DELETE
 * @access private (only admin or user him self)
 -----------------------------------------*/
 module.exports.deleteUserAccountController = asyncHandler(async (req, res) => {
  // Get user by id
  const user = await User.findById(req.params.id);
  if(!user){
    return res.status(404).json({message: 'User not found !'});
  }
  // @TODO - Get all posts for this user
  // @TODO - Get all public ids for images of this posts
  // @TODO - Delete all images posts in cloudinary
  // Delete image profile in cloudinary
  await cloudinarydeleteImage(user.profilePhoto.publicId);
  // @TODO - Delete all posts and comments for this user
  // Delete user
  await user.deleteOne();
  // Send response to client
  res.status(200).json({message: 'Account has been deleted succussfuly !'});
 })