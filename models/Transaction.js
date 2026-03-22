const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: [true, "Type is required"],
    },
    category: {
      type: String,
      enum: ["Food", "Housing", "Entertainment", "Health", "Transport", "Shopping", "Utilities", "Investment", "Income", "Other"],
      default: "Other",
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      maxlength: [250, "Note cannot exceed 250 characters"],
    },
    icon: {
      type: String,
      default: "💳",
      maxlength: [5, "Icon too long"],
    },
  },
  { timestamps: true }
);

// Index for faster queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });

transactionSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    ret.id = ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
