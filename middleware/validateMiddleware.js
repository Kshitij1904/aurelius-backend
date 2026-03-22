const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 50 }).withMessage("Name must be under 50 characters"),

  body("email")
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain a letter")
    .matches(/[0-9]/).withMessage("Password must contain a number"),
];

const loginRules = [
  body("email")
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty().withMessage("Password is required"),
];

const transactionRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required"),

  body("amount")
    .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),

  body("type")
    .isIn(["credit", "debit"]).withMessage("Type must be credit or debit"),

  body("category")
    .notEmpty().withMessage("Category is required"),

  body("date")
    .optional()
    .isISO8601().withMessage("Invalid date format"),
];

const budgetRules = [
  body("category")
    .trim()
    .notEmpty().withMessage("Category is required"),

  body("amount")
    .isFloat({ min: 1 }).withMessage("Budget amount must be at least 1"),
];

module.exports = { validate, registerRules, loginRules, transactionRules, budgetRules };
