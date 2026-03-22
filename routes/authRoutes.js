const express = require("express");
const router = express.Router();
const { register, login, verifyOTP, resendOTP, getMe, forgotPassword, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");
const { validate, registerRules, loginRules } = require("../middleware/validateMiddleware");
const { body } = require("express-validator");

router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login", authLimiter, loginRules, validate, login);
router.post(
  "/verify-otp",
  authLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp").isLength({ min: 4, max: 6 }).withMessage("OTP must be 4-6 digits"),
  ],
  validate,
  verifyOTP
);
router.post(
  "/resend-otp",
  authLimiter,
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  resendOTP
);
router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  [
    body("otp").notEmpty().withMessage("OTP is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  resetPassword
);
router.get("/me", protect, (req, res, next) => {
  console.log("🔥 /api/auth/me route HIT");
  next();
}, getMe);

module.exports = router;
