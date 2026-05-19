const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ExpressError = require("../utils/ExpressError");

module.exports.isLoggedIn = async (req,res,next) => {

  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return next(
      new ExpressError(
        401,
        "Unauthorized"
      )
    );
  }

  try {

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user =
      await User.findById(decoded.userId)
        .select("_id email activeSessionId");
    if (!user) {
      return next(
        new ExpressError(
          401,
          "User not found"
        )
      );
    }
/*
      Session Validation
    */
    if (
      user.activeSessionId !==
      decoded.sessionId
    ) {
      return next(
        new ExpressError(
          401,
          "Session expired"
        )
      );
    }
    req.identity = {
      userId: user._id,
      email: user.email
    };

    next();

  } catch (error) {

    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return next(
        new ExpressError(
          401,
          "Invalid token"
        )
      );
    }

    return next(error);
  }
};