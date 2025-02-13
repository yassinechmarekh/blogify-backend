const asyncHandler = require("express-async-handler");
const Comment = require("../models/commentModel");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const {
  createCommentValidation,
  updateCommentValidaton,
} = require("../utils/validations/commentValidation");

/**----------------------------------------
 * @desc Create comment
 * @route /api/comments
 * @method POST
 * @access private (Only logged in user)
 -----------------------------------------*/
module.exports.createCommentController = asyncHandler(async (req, res) => {
  const { error } = createCommentValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const comment = new Comment({
    postId: req.body.postId,
    user: req.user.id,
    content: req.body.content,
  });
  await comment.save();

  const getComment = await Comment.findById(comment._id).populate(
    "user",
    "username profilePhoto"
  );

  res.status(201).json(getComment);
});

/**----------------------------------------
 * @desc Delete comment
 * @route /api/comments/:id
 * @method DELETE
 * @access private (Only admin or owner of the comment)
 -----------------------------------------*/
module.exports.deleteCommentController = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found !" });
  }

  if (req.user.status === "admin" || req.user.id === comment.user.toString()) {
    await Comment.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ message: "Comment has been deleted successfully !" });
  } else {
    res.status(403).json({
      message: "Your are not authorized, only admin or owner of this comment !",
    });
  }
});

/**----------------------------------------
 * @desc Update comment
 * @route /api/comments/:id
 * @method PUT
 * @access private (Only owner of the comment)
 -----------------------------------------*/
module.exports.updateCommentController = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found !" });
  }

  if (req.user.id !== comment.user.toString()) {
    return res.status(403).json({
      message:
        "Your are not authorized, only owner of this comment can updated !",
    });
  }

  const { error } = updateCommentValidaton(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  await Comment.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        content: req.body.content,
      },
    },
    { new: true }
  );

  res.status(200).json({ message: "Comment updated successfully !" });
});

/**----------------------------------------
 * @desc Get Comments by user
 * @route /api/comments/user/:id
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getCommentsByUserController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not Found !" });
  }
  const comments = await Comment.find({ user: req.params.id });
  const result = await Promise.all(
    comments.map(async (comment) => {
      const post = await Post.findOne({ _id: comment.postId })
        .select("title slug author")
        .populate("author", "-password");
      return {
        content: comment.content,
        likes: comment.likes.length,
        postTitle: post.title,
        postSlug: post.slug,
        author: post.author,
      };
    })
  );
  return res.status(200).json(result);
});

/**----------------------------------------
 * @desc Get All Comments
 * @route /api/comments
 * @method GET
 * @access private (Only admin)
 -----------------------------------------*/
module.exports.getAllCommentsController = asyncHandler(async (req, res) => {
  const comments = await Comment.find()
    .populate("user")
    .populate({
      path: "postId",
      select: "title slug author",
      populate: {
        path: "author",
      },
    })
    .sort({ createdAt: -1 });

  res.status(200).json(comments);
});

/**----------------------------------------
 * @desc Toggle like comment
 * @route /api/comments/like/:id
 * @method PUT
 * @access public
 -----------------------------------------*/
module.exports.toggleLikeCommentController = asyncHandler(async (req, res) => {
  let comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found !" });
  }

  const isAlreadyLiked = comment.likes.find(
    (user) => user.toString() === req.user.id
  );

  if (isAlreadyLiked) {
    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          likes: req.user.id,
        },
      },
      { new: true }
    );
  } else {
    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          likes: req.user.id,
        },
      },
      { new: true }
    );
  }

  res.status(200).json(comment);
});

/**----------------------------------------
 * @desc Delete many comments
 * @route /api/comments
 * @method DELETE
 * @access private (Only admin or owner of comments)
 -----------------------------------------*/
module.exports.deleteManyCommentsController = asyncHandler(async (req, res) => {
  const { commentsIds } = req.body;
  if (!commentsIds || !Array.isArray(commentsIds) || commentsIds.length === 0) {
    return res.status(400).json({ message: "No comments to delete !" });
  }

  const comments = await Comment.find({ _id: { $in: commentsIds } });
  if (comments.length !== commentsIds.length) {
    return res
      .status(404)
      .json({ message: "One or more comments not found !" });
  }

  const isOwner = comments.every(
    (comment) => comment.user.toString() === req.user.id
  );
  if (req.user.status !== "admin" && !isOwner) {
    return res
      .status(403)
      .json({ message: "You are not allowed to delete these comments!" });
  }

  const result = await Comment.deleteMany({ _id: { $in: commentsIds } });

  res.status(200).json({
    message: `${result.deletedCount} comments have been deleted successfully!`,
  });
});

/**----------------------------------------
 * @desc Get liked comments
 * @route /api/comments/liked
 * @method GET
 * @access private (Only logged)
 -----------------------------------------*/
module.exports.getLikedCommentsController = asyncHandler(async (req, res) => {
  const likedComments = await Comment.find({ likes: req.user.id })
    .populate({
      path: "postId",
      select: "title slug author",
      populate: { path: "author" },
    })
    .populate("user")
    .sort({ createdAt: -1 });

  let { pageNumber, page } = req.query;
  if (pageNumber && page) {
    pageNumber = parseInt(pageNumber);
    page = parseInt(page);
    const paginateLikedComments = likedComments.slice(
      (page - 1) * pageNumber,
      pageNumber * page
    );
    return res
      .status(200)
      .json({ comments: paginateLikedComments, total: likedComments.length });
  }

  res.status(200).json(likedComments);
});

/**----------------------------------------
 * @desc Get comments count
 * @route /api/comments/count
 * @method GET
 * @access private (Only admin)
 -----------------------------------------*/
module.exports.getCommentsCountController = asyncHandler(async (req, res) => {
  const commentsCount = await Comment.countDocuments();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const countLastMonth = await Comment.countDocuments({
    createdAt: { $gte: oneMonthAgo },
  });
  res.status(200).json({ commentsCount, countLastMonth });
});

/**----------------------------------------
 * @desc Get comments count by author
 * @route /api/comments/author/count
 * @method GET
 * @access private (Only author)
 -----------------------------------------*/
module.exports.getCommentsCountByAuthorController = asyncHandler(
  async (req, res) => {
    if (req.user.status !== "author") {
      return res.status(403).json({ message: "Your are unauthorized !" });
    }

    const posts = await Post.find({ author: req.user.id }).populate("comments");

    if (!posts || posts.length === 0) {
      return res.status(200).json({ commentsCount: 0, countLastMonth: 0 });
    }

    const postIds = posts.map((post) => post._id);
    const commentsCount = await Comment.countDocuments({
      postId: { $in: postIds },
    });

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const countCommentsLastMonth = await Comment.countDocuments({
      postId: { $in: postIds },
      createdAt: { $gte: oneMonthAgo },
    });

    res
      .status(200)
      .json({ commentsCount, countLastMonth: countCommentsLastMonth });
  }
);

/**----------------------------------------
 * @desc Get comments likes by author
 * @route /api/comments/likes/count
 * @method GET
 * @access private (Only author)
 -----------------------------------------*/
module.exports.getCommentsLikesByAuthorController = asyncHandler(
  async (req, res) => {
    if (req.user.status !== "author") {
      return res.status(403).json({ message: "You are unauthorized!" });
    }

    const comments = await Comment.find({ user: req.user.id });

    const likes = comments.reduce(
      (total, comment) => total + comment.likes.length,
      0
    );

    const commentsCount = comments.length;

    res.status(200).json({ likes, commentsCount });
  }
);

/**----------------------------------------
 * @desc Get comments by post id
 * @route /api/comments/post/:id
 * @method GET
 * @access public
 -----------------------------------------*/
module.exports.getCommentsByPostController = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(200).json({ message: "Post not found !" });
  }

  const comments = await Comment.find({ postId: post._id }).populate(
    "user",
    "username profilePhoto"
  );

  res.status(200).json(comments);
});
