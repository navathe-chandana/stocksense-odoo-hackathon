const express = require("express");

const {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    message: "Authentication successful",
    user: req.user
  });
});

module.exports = router;