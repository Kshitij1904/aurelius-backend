const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

// @route GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (safePage - 1) * safeLimit;
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(safeLimit);

    res.json({ transactions, total, page: safePage, pages: Math.ceil(total / safeLimit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route GET /api/transactions/:id
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route POST /api/transactions
exports.createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, note, icon } = req.body;
    const numericAmount = Number(amount);
    if (!title || amount === undefined || !type || !category) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    if (isNaN(numericAmount)) {
      return res.status(400).json({ message: "Amount must be a number" });
    }
    const txDate = date ? new Date(date) : new Date();

    const transaction = await Transaction.create({
      user: req.user.id,
      title,
      amount: numericAmount,
      type,
      category,
      date: txDate,
      note,
      icon,
    });

    // 🔥 Auto budget logic (create + update spent)
    if (type === "debit") {
      const month = txDate.getMonth() + 1;
      const year = txDate.getFullYear();

      let budget = await Budget.findOne({
        user: req.user.id,
        category,
        month,
        year,
      });

      if (!budget) {
        // auto-create budget
        await Budget.create({
          user: req.user.id,
          category,
          amount: numericAmount * 5,
          spent: numericAmount,
          month,
          year,
          icon,
        });
      } else {
        // update spent
        budget.spent = (budget.spent || 0) + numericAmount;
        await budget.save();
      }
    }

    res.status(201).json({ transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      ((({ title, amount, type, category, date, note, icon }) => ({ title, amount, type, category, date, note, icon }))(req.body)),
      { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @route DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
