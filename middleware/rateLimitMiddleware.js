const rateLimit = require("express-rate-limit");

// If behind proxy (Render, Vercel, etc.), trust proxy headers
// Make sure in server.js you also set: app.set('trust proxy', 1);

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many authentication attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // allow successful logins without counting
});

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many API requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Optional: centralized handler (can be reused if needed)
exports.rateLimitHandler = (req, res) => {
  console.warn(`Rate limit hit: ${req.ip}`);
  res.status(429).json({ message: "Too many requests. Please try again later." });
};
