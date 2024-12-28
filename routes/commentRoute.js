const router = require("express").Router();
const {
  createCommentController,
  deleteCommentController,
  updateCommentController,
} = require("../controllers/commentController");
const { validateObjectId } = require("../middlewares/errorHandler");
const { verifyToken } = require("../middlewares/verifyToken");

// /api/comments
router.route("/").post(verifyToken, createCommentController);

// /api/comments/:id
router
  .route("/:id")
  .delete(validateObjectId, verifyToken, deleteCommentController)
  .put(validateObjectId, verifyToken, updateCommentController);

module.exports = router;
