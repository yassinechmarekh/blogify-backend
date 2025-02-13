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
  getLikedPostsByUserController,
  getPostsByAuthorController,
  deleteManyPostsController,
  getPostsStatsByCategoriesController,
  getPostCountByAuthorController,
  getPostsLikesCountByAuthorController,
  getLatestPostsByAuthorController,
  getPostsStatsByCategoryAndAuthorController,
  getLatestPostsByAuthorIdController,
  getLatestPostsAdminController,
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
  .get(getAllPostsController)
  .delete(verifyToken, deleteManyPostsController);

// /api/posts/count
router.route("/count").get(verfiyTokenAndAdmin, getPostsCountController);

// /api/posts/:id
router
  .route("/:id")
  .delete(validateObjectId, verifyToken, deletePostController)
  .put(validateObjectId, verifyToken, updatePostController);

// /api/posts/stats
router
  .route("/stats")
  .get(verfiyTokenAndAdmin, getPostsStatsByCategoriesController);

// /api/posts/latest
router.route("/latest").get(verifyToken, getLatestPostsByAuthorController);

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
router
  .route("/like/:id")
  .put(validateObjectId, verifyToken, toggleLikePostController);

// /api/posts/liked/user/:id
router
  .route("/liked/user/:id")
  .get(validateObjectId, getLikedPostsByUserController);

// /api/posts/user/:id
router.route("/user/:id").get(validateObjectId, getPostsByAuthorController);

// /api/posts/author/count
router.route("/author/count").get(verifyToken, getPostCountByAuthorController);

// /api/posts/likes/count
router
  .route("/likes/count")
  .get(verifyToken, getPostsLikesCountByAuthorController);

// /api/posts/stats/author
router
  .route("/stats/author")
  .get(verifyToken, getPostsStatsByCategoryAndAuthorController);

// /api/posts/latest/author/:id
router
  .route("/latest/author/:id")
  .get(validateObjectId, getLatestPostsByAuthorIdController);

// /api/posts/latest/admin
router.route("/latest/admin").get(getLatestPostsAdminController);

module.exports = router;
