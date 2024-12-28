const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const slugify = require("slugify");
const {
  createPostValidation,
  updatePostValidation,
} = require("../utils/validations/postValidation");
const {
  cloudinaryUploadImage,
  cloudinarydeleteImage,
} = require("../utils/cloudinary");
const Post = require("../models/postModel");

/**----------------------------------------
 * @desc Create new post
 * @route /api/posts
 * @method POST
 * @access private  (only authors)
 -----------------------------------------*/
module.exports.createPostController = asyncHandler(async (req, res) => {
  if (req.user.status !== "author") {
    return res.status(401).json({ message: "Not allowed, only authors !" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No image provided !" });
  }

  const { error } = createPostValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  let post = await Post.findOne({ slug: slugify(req.body.title) });
  if (post) {
    return res.status(400).json({ message: "This title is already exist !" });
  }

  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  post = new Post({
    title: req.body.title,
    slug: slugify(req.body.title),
    image: {
      url: result.secure_url,
      publicId: result.public_id,
    },
    content: req.body.content,
    author: req.user.id,
    category: req.body.category,
  });
  await post.save();

  res.status(201).json(post);

  fs.unlinkSync(imagePath);
});

/**----------------------------------------
 * @desc Get all posts
 * @route /api/posts
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getAllPostsController = asyncHandler(async (req, res) => {
  let { postsNumber, page, category } = req.query;
  postsNumber = postsNumber || 6;
  page = page || 1;
  let posts;
  if (category) {
    posts = await Post.find({ category })
      .skip((page - 1) * postsNumber)
      .limit(postsNumber)
      .populate("author", ["username"])
      .sort({ createdAt: -1 });
  } else {
    posts = await Post.find()
      .skip((page - 1) * postsNumber)
      .limit(postsNumber)
      .populate("author", ["username"])
      .sort({ createdAt: -1 });
  }
  res.status(200).json({ page: page, postPerPage: postsNumber, posts });
});

/**----------------------------------------
 * @desc Get specific post by slug
 * @route /api/posts/:slug
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getPostController = asyncHandler(async (req, res) => {
  const post = await Post.find({ slug: req.params.slug }).populate("author", [
    "-password",
  ]);
  if (!post) {
    return res.status(404).json({ message: "Post not found !" });
  }
  res.status(200).json(post);
});

/**----------------------------------------
 * @desc Get posts count
 * @route /api/posts/count
 * @method GET
 * @access private (only admin)
 -----------------------------------------*/
module.exports.getPostsCountController = asyncHandler(async (req, res) => {
  const postsCount = await Post.countDocuments();
  res.status(200).json({ count: postsCount });
});

/**----------------------------------------
 * @desc Delete post
 * @route /api/posts/:id
 * @method DELETE
 * @access private (only admin or owner of the post)
 -----------------------------------------*/
module.exports.deletePostController = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found !" });
  }

  if (req.user.status === "admin" || req.user.id === post.author.toString()) {
    await cloudinarydeleteImage(post.image.publicId);
    await post.deleteOne();

    // @TODO - Delete all comments belong to this post

    res.status(200).json({ message: "Post has deleted successfully !" });
  } else {
    return res
      .status(403)
      .json({ message: "Your are not allowed to delete this post !" });
  }
});

/**----------------------------------------
 * @desc Update post
 * @route /api/posts/:id
 * @method PUT
 * @access private (Owner of the post)
 -----------------------------------------*/
module.exports.updatePostController = asyncHandler(async (req, res) => {
  // validation
  const { error } = updatePostValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  // get post
  let post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found !" });
  }
  // check authorization
  if (req.user.id !== post.author.toString()) {
    return res
      .status(403)
      .json({ message: "Your are not authorized to update this post !" });
  }
  // check if slug already exist
  let slug;
  if (req.body.title) {
    const slugDouble = await Post.findOne({ slug: slugify(req.body.title) });
    if (slugDouble) {
      return res.status(400).json({ message: "This title already exist !" });
    }
    slug = slugify(req.body.title);
  } else {
    slug = post.slug;
  }
  // update post
  post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        slug: slug,
        content: req.body.content,
        category: req.body.category,
      },
    },
    { new: true }
  );
  // res to client
  res.status(200).json({ message: "Post updated successfully!", post });
});

/**----------------------------------------
 * @desc Update post image
 * @route /api/posts/upload-photo/:id
 * @method PUT
 * @access private (Only owner of the post)
 -----------------------------------------*/
module.exports.updateImagePostController = asyncHandler(async (req, res) => {
  // validation image
  if (!req.file) {
    return res.status(400).json({ message: "No image provided !" });
  }
  // get post
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found !" });
  }
  // check if user logged is owner for this post
  if (req.user.id !== post.author.toString()) {
    return res
      .status(403)
      .json({ message: "You are not alloed, only owner of this post !" });
  }
  // remove old image
  await cloudinarydeleteImage(post.image.publicId);
  // upload new image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);
  // update post in db
  await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  );
  // send res to client
  res.status(200).json({ message: "Post image is updated successfully !" });
  // delete image from server
  fs.unlinkSync(imagePath);
});

/**----------------------------------------
 * @desc Toggle like post
 * @route /api/posts/like/:id
 * @method PUT
 * @access private (Only logged in user)
 -----------------------------------------*/
 module.exports.toggleLikePostController = asyncHandler(async (req, res) => {
  let post = await Post.findById(req.params.id);
  if(!post){
    return res.status(404).json({message: 'Post not found !'});
  }
  const isAlreadyLiked = post.likes.find((user) => user.toString() === req.user.id);
  
  if(isAlreadyLiked){
    post = await Post.findByIdAndUpdate(req.params.id,{
      $pull: {
        likes: req.user.id,
      }
    },{new: true});
  }else{
    post = await Post.findByIdAndUpdate(req.params.id,{
      $push: {
        likes: req.user.id,
      }
    },{new: true});
  }

  res.status(200).json(post);
 });