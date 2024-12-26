const router = require("express").Router();
const {
  getAllUsersController,
  getAllAuthorsController,
  gettAllReadersController,
  getCountAuthorsController,
  getCountReadersController,
  getUserController,
  createAuthorController,
  updateUserProfileController,
  updateUserPasswordController,
  uploadProfilePhotoController,
  deleteUserAccountController,
} = require("../controllers/userController");
const {
  verifyToken,
  verfiyTokenAndAdmin,
  verfiyTokenAndUser,
  verfiyTokenAndAuthorization,
} = require("../middlewares/verifyToken");
const { validateObjectId } = require("../middlewares/errorHandler");
const photoUpload = require("../middlewares/uploadPhoto");

// /api/users/profile
router.route("/profile").get(verfiyTokenAndAdmin, getAllUsersController);

// /api/users/profile/:id
router
  .route("/profile/:id")
  .get(validateObjectId, getUserController)
  .put(validateObjectId, verfiyTokenAndUser, updateUserProfileController)
  .delete(validateObjectId, verfiyTokenAndAuthorization, deleteUserAccountController);

// /api/users/password/:id
router
  .route("/password/:id")
  .put(validateObjectId, verfiyTokenAndUser, updateUserPasswordController);

// /api/users/authors
router
  .route("/authors")
  .get(getAllAuthorsController)
  .post(verfiyTokenAndAdmin, createAuthorController);

// /api/users/authors/count
router
  .route("/authors/count")
  .get(verfiyTokenAndAdmin, getCountAuthorsController);

// /api/users/readers
router.route("/readers").get(verfiyTokenAndAdmin, gettAllReadersController);

// /api/users/readers/count
router
  .route("/readers/count")
  .get(verfiyTokenAndAdmin, getCountReadersController);

// /api/users/profile/upload-profile-photo
router.route("/profile/upload-profile-photo").post(verifyToken, photoUpload.single('image'), uploadProfilePhotoController);

module.exports = router;
