const router = require("express").Router();
const {
  registerController,
  loginController,
  verifyUserAccountController,
  forgetPasswordController,
  getResetPasswordController,
  resetPasswordController,
} = require("../controllers/authController");

// api/auth/register
router.post("/register", registerController);

// api/auth/login
router.post("/login", loginController);

// /api/auth/:userId/verify/:token
router.get("/:userId/verify/:token", verifyUserAccountController);

// /api/auth/forget-password
router.post("/forget-password", forgetPasswordController);

// /api/auth/reset-password/:userId/:token
router
  .route("/reset-password/:userId/:token")
  .get(getResetPasswordController)
  .post(resetPasswordController);

module.exports = router;
