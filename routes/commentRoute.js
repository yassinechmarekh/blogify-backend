const router = require("express").Router();
const {
  createCommentController,
  deleteCommentController,
  updateCommentController,
  getCommentsByUserController,
  getAllCommentsController,
  toggleLikeCommentController,
  deleteManyCommentsController,
  getLikedCommentsController,
  getCommentsCountController,
  getCommentsCountByAuthorController,
  getCommentsLikesByAuthorController,
  getCommentsByPostController,
} = require("../controllers/commentController");
const { validateObjectId } = require("../middlewares/errorHandler");
const {
  verifyToken,
  verfiyTokenAndAdmin,
} = require("../middlewares/verifyToken");

// /api/comments
router
  .route("/")
  .post(verifyToken, createCommentController)
  .get(verfiyTokenAndAdmin, getAllCommentsController)
  .delete(verifyToken, deleteManyCommentsController);

// /api/comments/:id
router
  .route("/:id")
  .delete(validateObjectId, verifyToken, deleteCommentController)
  .put(validateObjectId, verifyToken, updateCommentController);

// /api/comments/user/:id
router.route("/user/:id").get(validateObjectId, getCommentsByUserController);

// /api/comments/like/:id
router
  .route("/like/:id")
  .put(validateObjectId, verifyToken, toggleLikeCommentController);

// /api/comments/liked
router
  .route("/liked")
  .get(verifyToken, getLikedCommentsController);

// /api/comments/count
router.route('/count').get(verfiyTokenAndAdmin, getCommentsCountController);

// /api/comments/author/count
router.route('/author/count').get(verifyToken, getCommentsCountByAuthorController);

// /api/comments/likes/count
router.route('/likes/count').get(verifyToken, getCommentsLikesByAuthorController);

// /api/comments/post/:id
router.route('/post/:id').get(validateObjectId, getCommentsByPostController);

module.exports = router;
