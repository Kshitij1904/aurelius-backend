const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      trim: true,
      enum: ["Food", "Housing", "Entertainment", "Health", "Transport", "Shopping", "Utilities", "Investment", "Other"],
      required: [true, "Category is required"],
    },
    amount: {
      type: Number,
      required: [true, "Budget amount is required"],
      min: [1, "Budget must be at least 1"],
    },
    month: {
      type: Number,
      required: true,
      default: () => new Date().getMonth() + 1,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    icon: {
      type: String,
      default: "💰",
    },
    color: {
      type: String,
      default: "#6366f1",
      match: [/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid color hex"],
    },
  },
  { timestamps: true }
);

// Unique budget per category per month per year per user
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

budgetSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Budget", budgetSchema);
