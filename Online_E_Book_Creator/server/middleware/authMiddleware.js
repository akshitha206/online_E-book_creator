

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please login."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("AUTH ERROR: JWT_SECRET is missing.");
      return res.status(500).json({
        message: "Server authentication configuration error."
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("JWT VERIFIED. USER ID:", decoded.userId);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.error("AUTH ERROR: User not found:", decoded.userId);

      return res.status(401).json({
        message: "User not found. Please login again."
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("AUTHENTICATION FAILURE:", error.name, error.message);

    return res.status(401).json({
      message: "Invalid or expired authentication token."
    });
  }
};

module.exports = authMiddleware;
