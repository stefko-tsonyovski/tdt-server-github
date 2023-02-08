const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  showCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authentication");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPassword);
router.post("/logout", authenticateUser, logout);
router.get("/showMe", authenticateUser, showCurrentUser);

module.exports = router;
