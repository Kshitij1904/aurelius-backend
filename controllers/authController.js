const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("../utils/sendEmail");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const otp = generateOTP();
    const user = await User.create({
      name,
      email,
      password,
      otp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    await sendOTPEmail(email, name, otp);

    res.status(201).json({ message: "Registration successful. Check your email for OTP.", email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp?.code || user.otp.code !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (new Date() > user.otp.expiresAt)
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.getInitials() },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route POST /api/auth/resend-otp
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    user.otp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    await sendOTPEmail(email, user.name, otp);
    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // TEMP: Skip email verification for development
    // if (!user.isVerified) {
    //   const otp = generateOTP();
    //   user.otp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    //   await user.save();
    //   await sendOTPEmail(email, user.name, otp);
    //   return res.status(403).json({ message: "Email not verified. A new OTP has been sent.", email });
    // }

    // Proceed to login without verification (dev mode)
    const token = generateToken(user._id);
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.getInitials() },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    // req.user should already be set by protect middleware
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // If middleware attached full user, return it directly
    if (req.user._id) {
      return res.json({
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          avatar: req.user.getInitials ? req.user.getInitials() : undefined,
        },
      });
    }

    // Fallback: if middleware only attached decoded token
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.getInitials(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    user.resetOTP = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };

    await user.save();
    await sendOTPEmail(email, user.name, otp);

    res.json({ message: "Reset OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { otp, password } = req.body;

    if (!otp || !password) {
      return res.status(400).json({ message: "OTP and new password required" });
    }

    const user = await User.findOne({ "resetOTP.code": otp }).select("+password");

    if (!user) return res.status(400).json({ message: "Invalid OTP" });

    if (new Date() > user.resetOTP.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Let mongoose pre-save hook handle hashing
    user.password = password;
    user.resetOTP = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
