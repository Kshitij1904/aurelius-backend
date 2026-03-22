const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// @route GET /api/budgets
exports.getBudgets = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const budgets = await Budget.find({ user: req.user.id, month, year });

    // Calculate spent amount for each budget category
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (b) => {
        const result = await Transaction.aggregate([
          {
            $match: {
              user: b.user,
              category: b.category,
              type: "debit",
              date: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const spent = result[0]?.total || 0;
        return { ...b.toObject(), spent };
      })
    );

    res.json({ budgets: budgetsWithSpent, month, year });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/budgets
exports.createBudget = async (req, res) => {
  try {
    const { category, amount, month, year, icon, color } = req.body;
    const now = new Date();

    const budget = await Budget.create({
      user: req.user.id,
      category,
      amount,
      month: month || now.getMonth() + 1,
      year: year || now.getFullYear(),
      icon,
      color,
    });
    res.status(201).json({ budget });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: "Budget for this category already exists this month" });
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/budgets/:id
exports.updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ message: "Budget not found" });
    res.json({ budget });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/budgets/:id
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!budget) return res.status(404).json({ message: "Budget not found" });
    res.json({ message: "Budget deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
