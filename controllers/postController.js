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
  cloudinarydeleteMultiplrImage,
} = require("../utils/cloudinary");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");
const { htmlToText } = require("html-to-text");
const NewsLetter = require("../models/newsLetterModel");
const sendEmail = require("../utils/sendEmail");

/**----------------------------------------
 * @desc Create new post
 * @route /api/posts
 * @method POST
 * @access private  (only authors)
 -----------------------------------------*/
module.exports.createPostController = asyncHandler(async (req, res) => {
  if (req.user.status !== "author" && req.user.status !== "admin") {
    return res
      .status(401)
      .json({ message: "Not allowed, only authors or admin !" });
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
    slug: slugify(req.body.title, { lower: true }),
    image: {
      url: result.secure_url,
      publicId: result.public_id,
    },
    content: req.body.content,
    author: req.user.id,
    category: req.body.category,
  });
  await post.save();

  const newsletter = await NewsLetter.find({ notification: true }).select(
    "email"
  );
  const emails = newsletter.map((item) => item.email);

  const link = `${process.env.CLIENT_DOMAIN}/posts/${post.slug}`;
  post = await Post.findById(post._id)
    .populate("author", "username")
    .populate("category", "title");

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
        <h3 style="color: #333;">Hello,</h3>
        <p style="color: #555; font-size: 16px;">
          <strong style="text-transform: capitalize;">${post.author.username}</strong> has just published a new post in the 
          <strong style="text-transform: capitalize;">${post.category.title}</strong> category. Check it out at the link below:
        </p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${link}" 
            style="color: #514DCC; text-decoration: underline; text-transform: capitalize; display: inline-block; font-size: 16px;">
            ${post.title}
          </a>
        </p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #777; font-size: 14px;">Best regards,<br><strong>The Blogify Team</strong></p>
      </div>
    </div>
  `;

  if (emails.length > 0) {
    await sendEmail(emails, "Bligify Newsletter - New Post", htmlTemplate);
  }

  res.status(201).json({ message: `${post.title} is created successfully !` });

  fs.unlinkSync(imagePath);
});

/**----------------------------------------
 * @desc Get all posts
 * @route /api/posts
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getAllPostsController = asyncHandler(async (req, res) => {
  let { postsNumber, page, category, limit, search } = req.query;
  postsNumber = parseInt(postsNumber);
  page = parseInt(page) || 1;
  let posts, total;
  if (category) {
    posts = await Post.find({ category })
      .skip((page - 1) * postsNumber)
      .limit(postsNumber)
      .populate("author", "username")
      .populate("category", "title slug")
      .sort({ createdAt: -1 });
    total = await Post.countDocuments({ category });
    return res.status(200).json({ posts, total });
  } else if (postsNumber) {
    posts = await Post.find()
      .skip((page - 1) * postsNumber)
      .limit(postsNumber)
      .populate("author")
      .populate("category", "title slug")
      .sort({ createdAt: -1 });
    total = await Post.countDocuments();
    return res.status(200).json({ posts, total });
  } else if (limit) {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title slug image author category createdAt")
      .populate("author", "username")
      .populate("category", "title slug");
  } else if (search) {
    let query = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ],
    };
    posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate("author", "username")
      .populate("category", "title slug");
  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author comments");
  }

  return res.status(200).json(posts);
});

/**----------------------------------------
 * @desc Get specific post by slug
 * @route /api/posts/:slug
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getPostController = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug })
    .populate("author", ["-password"])
    .populate("category", "title slug");
  if (!post) {
    return res.status(404).json({ message: "Post not found !" });
  }
  const relatedPosts = await Post.find({
    category: post.category,
    _id: { $nin: post._id },
  })
    .limit(3)
    .populate("category", "title slug")
    .populate("author", "username");
  const prevPost = await Post.findOne({ createdAt: { $lt: post.createdAt } })
    .sort({ createdAt: -1 })
    .select("title slug")
    .lean();

  const nextPost = await Post.findOne({ createdAt: { $gt: post.createdAt } })
    .sort({ createdAt: 1 })
    .select("title slug")
    .lean();
  res.status(200).json({ post, relatedPosts, prevPost, nextPost });
});

/**----------------------------------------
 * @desc Get posts count
 * @route /api/posts/count
 * @method GET
 * @access private (only admin)
 -----------------------------------------*/
module.exports.getPostsCountController = asyncHandler(async (req, res) => {
  const postsCount = await Post.countDocuments();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const countLastMonth = await Post.countDocuments({
    createdAt: { $gte: oneMonthAgo },
  });
  res.status(200).json({ postsCount, countLastMonth });
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

    await Comment.deleteMany({ postId: post._id });

    res
      .status(200)
      .json({ message: `"${post.title}" has deleted successfully !` });
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
  if (!post) {
    return res.status(404).json({ message: "Post not found !" });
  }
  const isAlreadyLiked = post.likes.find(
    (user) => user.toString() === req.user.id
  );

  if (isAlreadyLiked) {
    post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          likes: req.user.id,
        },
      },
      { new: true }
    );

    const message = {
      title: "Like Removed",
      message: `You have removed your like from: ${post.title}`,
    };

    return res.status(200).json({ message, likes: post.likes });
  } else {
    post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          likes: req.user.id,
        },
      },
      { new: true }
    );

    const message = {
      title: "Like Added",
      message: `You have liked the post: ${post.title}`,
    };

    return res.status(200).json({ message, likes: post.likes });
  }
});

/**----------------------------------------
 * @desc Liked Posts By User
 * @route /api/posts/liked/user/:id
 * @method Get
 * @access public
 -----------------------------------------*/
module.exports.getLikedPostsByUserController = asyncHandler(
  async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User Not Found !" });
    }
    const posts = await Post.find().populate("author").populate('category', 'title slug');
    const likedPosts = await posts.filter((post) =>
      post.likes.includes(user._id.toString())
    );
    let { pageNumber, page } = req.query;
    pageNumber = parseInt(pageNumber);
    page = parseInt(page);
    if (pageNumber && page) {
      const paginateLikedPosts = likedPosts.slice(
        (page - 1) * pageNumber,
        page * pageNumber
      );
      return res
        .status(200)
        .json({ posts: paginateLikedPosts, total: likedPosts.length });
    }

    res.status(200).json(likedPosts);
  }
);

/**----------------------------------------
 * @desc Get posts By Author
 * @route /api/posts/user/:id
 * @method Get
 * @access public
 -----------------------------------------*/
module.exports.getPostsByAuthorController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found !" });
  }

  let posts;
  let { pageNumber, page } = req.query;
  if (pageNumber) {
    pageNumber = parseInt(pageNumber);
    page = parseInt(page);
    total = await Post.countDocuments({ author: user._id });
    posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(pageNumber)
      .skip((page - 1) * pageNumber)
      .populate('category', 'title slug');

    return res.status(200).json({ total, posts });
  } else {
    posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("comments");
    return res.status(200).json(posts);
  }
});

/**----------------------------------------
 * @desc Delete Many Posts
 * @route /api/posts/
 * @method Delete
 * @access private (only admin or owner of the posts)
 -----------------------------------------*/
module.exports.deleteManyPostsController = asyncHandler(async (req, res) => {
  // get ids of posts to delete
  const { postsIds } = req.body;
  if (!postsIds || !Array.isArray(postsIds) || postsIds.length === 0) {
    return res.status(400).json({ message: "No posts to delete !" });
  }
  // get all posts
  const posts = await Post.find({ _id: { $in: postsIds } });
  if (posts.length !== postsIds.length) {
    return res.status(404).json({ message: "One post or more not found !" });
  }
  // check if user is admin or owner of all posts
  const isOwner = posts.every((post) => post.author.toString() === req.user.id);
  if (req.user.status !== "admin" && !isOwner) {
    return res.status(403).json({ message: "Your are not allowed !" });
  }
  // delete posts images
  const publicIds = posts.map((post) => post.image.publicId);
  if (publicIds.length > 0) {
    cloudinarydeleteMultiplrImage(publicIds);
  }
  // delete posts comments
  await Promise.all(
    posts.map(async (post) => {
      await Comment.deleteMany({ postId: post._id });
    })
  );
  // delete posts
  const result = await Post.deleteMany({ _id: { $in: postsIds } });
  // res to client
  res.status(200).json({
    message: `${result.deletedCount} posts have been deleted successfully!`,
  });
});

/**----------------------------------------
 * @desc Get Post Stats by categories
 * @route /api/posts/stats
 * @method Get
 * @access private (only admin)
 -----------------------------------------*/
module.exports.getPostsStatsByCategoriesController = asyncHandler(
  async (req, res) => {
    const categoriesShowed = await Category.find()
      .sort({ createdAt: 1 })
      .limit(4);
    const categoriesShowedIds = categoriesShowed.map(
      (category) => category._id
    );
    const others = await Category.find({ _id: { $nin: categoriesShowedIds } });
    const allCategories = await Category.find();
    let popular = {
      category: null,
      posts: 0,
    };

    const stats = await Promise.all(
      categoriesShowed.map(async (category) => {
        const posts = await Post.countDocuments({ category: category._id });
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(
          16
        )}`;
        return {
          category: category.title,
          posts: posts,
          fill: randomColor,
        };
      })
    );

    await Promise.all(
      allCategories.map(async (category) => {
        const posts = await Post.countDocuments({ category: category._id });
        if (posts > popular.posts) {
          (popular.category = category.title), (popular.posts = posts);
        }
      })
    );

    const othersIds = others.map((item) => item._id);
    const othersPosts = await Post.countDocuments({
      category: { $in: othersIds },
    });

    stats.push({
      category: "other",
      posts: othersPosts,
      fill: "#f54a00",
    });

    let chartConfig = {
      posts: {
        label: "Posts",
        color: "#514DCC",
      },
    };

    stats.map((item) => {
      chartConfig[item.category.toLowerCase()] = {
        label: item.category.toLowerCase(),
      };
    });

    res.status(200).json({ stats, chartConfig, popular });
  }
);

/**----------------------------------------
 * @desc Get Post Count by Author
 * @route /api/posts/author/count
 * @method Get
 * @access private (only author)
 -----------------------------------------*/
module.exports.getPostCountByAuthorController = asyncHandler(
  async (req, res) => {
    if (req.user.status !== "author") {
      return res.status(403).json({ message: "Your are unauthorized !" });
    }
    const posts = await Post.countDocuments({ author: req.user.id });
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const countLastMonth = await Post.countDocuments({
      author: req.user.id,
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({ posts, countLastMonth });
  }
);

/**----------------------------------------
 * @desc Get Count Posts Likes By Author
 * @route /api/posts/likes/count
 * @method Get
 * @access private (only author)
 -----------------------------------------*/
module.exports.getPostsLikesCountByAuthorController = asyncHandler(
  async (req, res) => {
    if (req.user.status !== "author") {
      return res.status(403).json({ message: "Your are unauthorized !" });
    }

    const posts = await Post.find({ author: req.user.id });

    if (!posts || posts.length === 0) {
      return res.status(200).json({ likes: 0, postsCount: 0 });
    }

    const likes = posts.reduce((total, post) => total + post.likes?.length, 0);

    const postsCount = posts.length;

    res.status(200).json({ likes, postsCount });
  }
);

/**----------------------------------------
 * @desc Get latest posts by author logged
 * @route /api/posts/latest
 * @method Get
 * @access private (only author)
 -----------------------------------------*/
module.exports.getLatestPostsByAuthorController = asyncHandler(
  async (req, res) => {
    if (req.user.status !== "author") {
      return res.status(403).json({ message: "Your are unauthorized !" });
    }
    let { limit } = req.query;
    if (limit) {
      limit = parseInt(limit);
      const posts = await Post.find({ author: req.user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("title slug content");
      const result = posts.map((post) => ({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        content: htmlToText(post.content, {
          wordwrap: 130,
        }),
        id: post.id,
      }));
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const countPostsLastMonth = await Post.countDocuments({
        author: req.user.id,
        createdAt: { $gte: oneMonthAgo },
      });

      return res.status(200).json({ posts: result, countPostsLastMonth });
    } else {
      return res.status(400).json({ message: "No limit provided !" });
    }
  }
);

/**----------------------------------------
 * @desc Get posts stats by category and author
 * @route /api/posts/stats/author
 * @method Get
 * @access private (only author)
 -----------------------------------------*/
module.exports.getPostsStatsByCategoryAndAuthorController = asyncHandler(
  async (req, res) => {
    if (req.user.status !== "author") {
      return res.status(403).json({ message: "You are unauthorized !" });
    }
    const categories = await Category.find().select("title");
    let categoriesStats = await Promise.all(
      categories.map(async (category) => {
        const posts = await Post.countDocuments({
          author: req.user.id,
          category: category._id,
        });
        return {
          category: category.title.toUpperCase(),
          posts,
        };
      })
    );

    categoriesStats.sort((a, b) => b.posts - a.posts);

    categoriesStats = categoriesStats.slice(0, 6);
    const topCategory = categoriesStats[0];

    res.status(200).json({ categoriesStats, topCategory });
  }
);

/**----------------------------------------
 * @desc Get latest posts by author id
 * @route /api/posts/latest/author/:id
 * @method Get
 * @access public
 -----------------------------------------*/
module.exports.getLatestPostsByAuthorIdController = asyncHandler(
  async (req, res) => {
    const author = await User.findOne({
      _id: req.params.id,
      status: { $ne: "reader" },
    });
    if (!author) {
      return res.status(404).json({ message: "Author not found !" });
    }
    let { limit } = req.query;
    if (!limit) {
      return res.status(400).json({ message: "Missing limit variable !" });
    }
    limit = parseInt(limit);
    const posts = await Post.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json(posts);
  }
);

/**----------------------------------------
 * @desc Get latest posts for admin
 * @route /api/posts/latest/admin
 * @method Get
 * @access public
 -----------------------------------------*/
module.exports.getLatestPostsAdminController = asyncHandler(
  async (req, res) => {
    const admin = await User.findOne({ status: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found !" });
    }

    let { limit } = req.query;
    if (!limit) {
      return res.status(400).json({ message: "Missing limit variable !" });
    }
    limit = parseInt(limit);
    const posts = await Post.find({ author: admin._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json(posts);
  }
);
