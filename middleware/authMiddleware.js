const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authorized. No token provided." });

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Not authorized. Token missing." });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.status(500).json({ message: "Server configuration error" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      if (e.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      if (e.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      console.error(e);
      return res.status(401).json({ message: "Authentication failed" });
    }

    const user = await User.findById(decoded.id)
      .select("_id name email")
      .lean();

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // attach minimal safe user with consistent id field
    req.user = { ...user, id: user._id };
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { protect };
