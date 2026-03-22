const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// @route GET /api/stats/summary
exports.getSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Monthly income & expenses
    const monthlyStats = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);

    const income = monthlyStats.find((s) => s._id === "credit")?.total || 0;
    const expenses = monthlyStats.find((s) => s._id === "debit")?.total || 0;
    const savings = income - expenses;

    // All-time balance
    const allTime = await Transaction.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);
    const totalCredit = allTime.find((s) => s._id === "credit")?.total || 0;
    const totalDebit = allTime.find((s) => s._id === "debit")?.total || 0;
    const totalBalance = totalCredit - totalDebit;

    res.json({ totalBalance, income, expenses, savings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route GET /api/stats/category-breakdown
exports.getCategoryBreakdown = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          type: "debit",
          date: { $gte: startOfMonth },
        },
      },
      { $group: { _id: "$category", value: { $sum: "$amount" } } },
      { $project: { name: "$_id", value: 1, _id: 0 } },
      { $sort: { value: -1 } },
    ]);

    res.json({ categories: breakdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route GET /api/stats/monthly-trend
exports.getMonthlyTrend = async (req, res) => {
  try {
    const months = 6;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const data = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const stats = data.filter(
        (d) => d._id.month === month && d._id.year === year
      );

      result.push({
        month: new Date(year, month - 1).toLocaleString("en", { month: "short" }),
        income: stats.find((s) => s._id.type === "credit")?.total || 0,
        expenses: stats.find((s) => s._id.type === "debit")?.total || 0,
      });
    }

    res.json({ trend: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
