const router = require("express").Router();
const {
  addEmailToNewsLetterController,
  getNewsletterController,
  updateNewsLetterController,
  deleteFromNewsletter,
  deleteManyEmailsFromNewsletterController,
} = require("../controllers/newsLetterController");
const { validateObjectId } = require("../middlewares/errorHandler");
const { verfiyTokenAndAdmin } = require("../middlewares/verifyToken");

// /api/newsletter
router
  .route("/")
  .post(addEmailToNewsLetterController)
  .get(verfiyTokenAndAdmin, getNewsletterController)
  .delete(verfiyTokenAndAdmin, deleteManyEmailsFromNewsletterController);

// /api/newsletter/:id
router
  .route("/:id")
  .put(validateObjectId, verfiyTokenAndAdmin, updateNewsLetterController)
  .delete(validateObjectId, verfiyTokenAndAdmin, deleteFromNewsletter);

module.exports = router;
