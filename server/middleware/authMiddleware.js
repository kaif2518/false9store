const jwt = require("jsonwebtoken");
const User = require("../models/User");

// protect: only logged-in users can pass
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorised, no token" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorised, token failed" });
  }
};

// admin: only the admin can pass (always used after protect)
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ message: "Admin access only" });
};

module.exports = { protect, admin };