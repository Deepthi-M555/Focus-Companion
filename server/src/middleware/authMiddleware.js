const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ExpressError = require("../utils/ExpressError");

module.exports.isLoggedIn = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ExpressError(401, "Unauthorized");
  }

  const token = authHeader.split(" ")[1];
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
  const user = await User.findById(decoded.userId);
  
  if (!user) {
    throw new ExpressError(401, "User not found");
  }

  if (user.activeSessionId !== decoded.sessionId) {
    throw new ExpressError(401, "Session expired");
  }

  req.user = user;
  next();
};