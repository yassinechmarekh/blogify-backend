const router = require("express").Router();
const {
  createPostController,
  getAllPostsController,
  getPostController,
  getPostsCountController,
  deletePostController,
  updatePostController,
  updateImagePostController,
  toggleLikePostController,
} = require("../controllers/postController");
const photoUpload = require("../middlewares/uploadPhoto");
const {
  verifyToken,
  verfiyTokenAndAdmin,
} = require("../middlewares/verifyToken");
const { validateObjectId } = require("../middlewares/errorHandler");

// /api/posts
router
  .route("/")
  .post(verifyToken, photoUpload.single("image"), createPostController)
  .get(getAllPostsController);

// /api/posts/count
router.route("/count").get(verfiyTokenAndAdmin, getPostsCountController);

// /api/posts/:id
router
  .route("/:id")
  .delete(validateObjectId, verifyToken, deletePostController)
  .put(validateObjectId, verifyToken, updatePostController);

// /api/posts/:slug
router.route("/:slug").get(getPostController);

// /api/posts/upload-photo/:id
router
  .route("/upload-photo/:id")
  .put(
    validateObjectId,
    verifyToken,
    photoUpload.single("image"),
    updateImagePostController
  );

// /api/posts/like/:id
router.route('/like/:id').put(validateObjectId ,verifyToken, toggleLikePostController);

module.exports = router;
