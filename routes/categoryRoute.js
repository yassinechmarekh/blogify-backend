const router = require("express").Router();
const {
  createCategoryController,
  getAllCategoriesController,
  getCategeoryController,
  updateCategoryController,
  updateCategoryImageController,
  deleteCategoryController,
  deleteManyCategoriesController,
} = require("../controllers/categoryController");
const { validateObjectId } = require("../middlewares/errorHandler");
const photoUpload = require("../middlewares/uploadPhoto");
const { verfiyTokenAndAdmin } = require("../middlewares/verifyToken");

// /api/categories
router
  .route("/")
  .post(
    verfiyTokenAndAdmin,
    photoUpload.single("image"),
    createCategoryController
  )
  .get(getAllCategoriesController)
  .delete(verfiyTokenAndAdmin, deleteManyCategoriesController);

// /api/categories/:slug
router.route("/:slug").get(getCategeoryController);

// /api/categories/:id
router
  .route("/:id")
  .put(validateObjectId, verfiyTokenAndAdmin, updateCategoryController)
  .delete(validateObjectId, verfiyTokenAndAdmin, deleteCategoryController);

// /api/categories/upoad-image/:id
router
  .route("/upoad-image/:id")
  .put(
    validateObjectId,
    verfiyTokenAndAdmin,
    photoUpload.single("image"),
    updateCategoryImageController
  );

module.exports = router;
