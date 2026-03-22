const { apiLimiter } = require("../middleware/rateLimitMiddleware");
const { param } = require("express-validator");
const express = require("express");
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");
const { validate, transactionRules } = require("../middleware/validateMiddleware");

router.use(protect);

router.use(apiLimiter);

router.route("/").get(getTransactions).post(transactionRules, validate, createTransaction);
router.route("/:id")
  .get(
    [param("id").isMongoId().withMessage("Invalid transaction ID")],
    validate,
    getTransaction
  )
  .put(
    [
      param("id").isMongoId().withMessage("Invalid transaction ID"),
      ...transactionRules,
    ],
    validate,
    updateTransaction
  )
  .delete(
    [param("id").isMongoId().withMessage("Invalid transaction ID")],
    validate,
    deleteTransaction
  );

module.exports = router;
