const express = require("express");
const router = express.Router();
const { getSummary, getCategoryBreakdown, getMonthlyTrend } = require("../controllers/statsController");
const { protect } = require("../middleware/authMiddleware");
const { apiLimiter } = require("../middleware/rateLimitMiddleware");
const { query } = require("express-validator");
const { validate } = require("../middleware/validateMiddleware");

router.use(protect);
router.use(apiLimiter);

router.get("/summary", getSummary);
router.get("/category-breakdown", getCategoryBreakdown);
router.get(
  "/monthly-trend",
  [
    query("months").optional().isInt({ min: 1, max: 12 }).withMessage("Months must be between 1 and 12"),
  ],
  validate,
  getMonthlyTrend
);

module.exports = router;
