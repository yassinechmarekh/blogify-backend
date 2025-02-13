const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const User = require("../models/userModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel");
const {
  createAuhtorValidation,
  updateUserProfileValidation,
  updateUserPasswordValidation,
} = require("../utils/validations/userValidation");
const {
  cloudinaryUploadImage,
  cloudinarydeleteImage,
  cloudinarydeleteMultiplrImage,
} = require("../utils/cloudinary");

/**----------------------------------------
 * @desc Get all users
 * @route /api/users/profile
 * @method GET
 * @access private  (only admin)
 -----------------------------------------*/
module.exports.getAllUsersController = asyncHandler(async (req, res) => {
  let users;
  const { limit } = req.query;
  if (limit) {
    users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const count = await User.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });
    return res.status(200).json({ users, count });
  }
  users = await User.find().select("-password").sort({ createdAt: -1 });
  const posts = await Post.find().select("likes");
  const result = await Promise.all(
    users.map(async (user) => {
      const commentCount = await Comment.countDocuments({ user: user._id });
      let postlikes = 0;
      await Promise.all(
        posts.map((post) => {
          if (post.likes.includes(user._id.toString())) {
            postlikes++;
          }
        })
      );
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt,
        comments: commentCount,
        "posts Likes": postlikes,
      };
    })
  );
  res.status(200).json(result);
});

/**----------------------------------------
 * @desc Get all auhtors
 * @route /api/users/authors
 * @method GET
 * @access private (Only admin)
 -----------------------------------------*/
module.exports.getAllAuthorsController = asyncHandler(async (req, res) => {
  const authors = await User.find({ status: "author" })
    .select("-password")
    .sort({ createdAt: -1 });
  const posts = await Post.find().select("likes");
  const result = await Promise.all(
    authors.map(async (author) => {
      const postsCount = await Post.countDocuments({ author: author._id });
      const commentCount = await Comment.countDocuments({ user: author._id });
      let postsLikes = 0;
      await Promise.all(
        posts.map((post) => {
          if (post.likes.includes(author._id.toString())) {
            postsLikes++;
          }
        })
      );
      return {
        _id: author._id,
        username: author.username,
        email: author.email,
        profilePhoto: author.profilePhoto,
        bio: author.bio,
        createdAt: author.createdAt,
        posts: postsCount,
        comments: commentCount,
        "posts Likes": postsLikes,
      };
    })
  );
  res.status(200).json(result);
});

/**----------------------------------------
 * @desc Get all readers
 * @route /api/users/readers
 * @method GET
 * @access private (only admin)
 -----------------------------------------*/
module.exports.gettAllReadersController = asyncHandler(async (req, res) => {
  const readers = await User.find({ status: "reader" })
    .select("-password")
    .sort({ createdAt: -1 });
  const posts = await Post.find().select("likes");
  const result = await Promise.all(
    readers.map(async (reader) => {
      const comments = await Comment.countDocuments({ user: reader._id });
      let postsLikes = 0;
      await Promise.all(
        posts.map((post) => {
          if (post.likes.includes(reader._id.toString())) {
            postsLikes++;
          }
        })
      );
      return {
        _id: reader._id,
        username: reader.username,
        email: reader.email,
        profilePhoto: reader.profilePhoto,
        createdAt: reader.createdAt,
        comments: comments,
        "posts Likes": postsLikes,
      };
    })
  );
  res.status(200).json(result);
});

/**----------------------------------------
 * @desc Get count of auhtors
 * @route /api/users/authors/count
 * @method GET
 * @access private (only admin)
 -----------------------------------------*/
module.exports.getCountAuthorsController = asyncHandler(async (req, res) => {
  const authorsCount = await User.find({ status: "author" }).countDocuments();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const countLastMonth = await User.find({
    status: "author",
    createdAt: { $gte: oneMonthAgo },
  }).countDocuments();
  res.status(200).json({ authorsCount, countLastMonth });
});

/**----------------------------------------
 * @desc Get count of readers
 * @route /api/users/readers/count
 * @method GET
 * @access private (only admin)
 -----------------------------------------*/
module.exports.getCountReadersController = asyncHandler(async (req, res) => {
  const readersCount = await User.find({ status: "reader" }).countDocuments();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const countLastMonth = await User.find({
    status: "reader",
    createdAt: { $gte: oneMonthAgo },
  }).countDocuments();
  res.status(200).json({ readersCount, countLastMonth });
});

/**----------------------------------------
 * @desc Get specific user
 * @route /api/users/profile/:id
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getUserController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found !" });
  }
  res.status(200).json(user);
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
    username: req.body.username,
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

  await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
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

  res.status(200).json({ message: "Profile updated successfully !" });
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
  if (!user) {
    return res.status(404).json({ message: "User not found !" });
  }
  if (req.body.email) {
    const emailExist = await User.find({ email: req.body.email });
    if (emailExist.length > 0) {
      return res
        .status(400)
        .json({ message: `${req.body.email} is already exist !` });
    }
  }
  const passwordIsMatch = await bcrypt.compare(
    req.body.currentPassword,
    user.password
  );
  if (!passwordIsMatch) {
    return res.status(400).json({ message: "Your old password is incorrect!" });
  }

  const salt = await bcrypt.genSalt(10);
  req.body.newPassword = await bcrypt.hash(req.body.newPassword, salt);

  if (req.body.email) {
    user.email = req.body.email;
  }
  user.password = req.body.newPassword;
  await user.save();

  res.status(200).json({
    message: `${
      req.body.email
        ? "Account informations is updated successfully !"
        : "Password updated successfully!"
    }`,
  });
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
  if (!user) {
    return res.status(404).json({ message: "User not found !" });
  }
  // Get all posts for this user
  const posts = await Post.find({ author: user._id });

  // Get all public ids for images of this posts
  const publicIds = posts?.map((post) => post.image.publicId);

  // Delete all images posts in cloudinary
  if (publicIds?.lenght > 0) {
    await cloudinarydeleteMultiplrImage(publicIds);
  }

  // Delete image profile in cloudinary
  if (user.profilePhoto.publicId) {
    await cloudinarydeleteImage(user.profilePhoto.publicId);
  }

  // Delete all posts and comments for this user
  await Post.deleteMany({ author: user._id });
  await Comment.deleteMany({ user: user._id });

  // Delete user
  await user.deleteOne();

  // Send response to client
  res.status(200).json({ message: "Account has been deleted succussfuly !" });
});

/**----------------------------------------
 * @desc Get admin
 * @route /api/users/admin
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getAdminUserController = asyncHandler(async (req, res) => {
  const user = await User.findOne({ status: "admin" }).select("-password");
  if (!user) {
    return res.status(404).json({ message: "Admin not found !" });
  }
  res.status(200).json(user);
});

/**----------------------------------------
 * @desc Get limit authors
 * @route /api/users/authors/limit
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getLimitAuthorsController = asyncHandler(async (req, res) => {
  let { limit } = req.query;
  if (!limit) {
    return res.status(400).json({ message: "No limit provided !" });
  }
  limit = parseInt(limit);
  const authors = await User.find({ status: "author" })
    .select("-password")
    .limit(limit);

  res.status(200).json(authors);
});
