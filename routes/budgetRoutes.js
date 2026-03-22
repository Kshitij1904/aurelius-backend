const { param } = require("express-validator");
const express = require("express");
const router = express.Router();
const { getBudgets, createBudget, updateBudget, deleteBudget } = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");
const { validate, budgetRules } = require("../middleware/validateMiddleware");

router.use(protect);

router.route("/").get(getBudgets).post(budgetRules, validate, createBudget);
router.route("/:id")
  .put(
    [
      param("id").isMongoId().withMessage("Invalid budget ID"),
      ...budgetRules,
    ],
    validate,
    updateBudget
  )
  .delete(
    [param("id").isMongoId().withMessage("Invalid budget ID")],
    validate,
    deleteBudget
  );

module.exports = router;
