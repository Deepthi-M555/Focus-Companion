const User = require("../models/User");
const bcrypt = require("bcrypt");
const ExpressError = require("../utils/ExpressError");
const jwt = require("jsonwebtoken");

module.exports.signup = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ExpressError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ExpressError(400, "User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = new User({
    email,
    passwordHash
  });

  await newUser.save();

  res.status(201).json({
    message: "User created successfully"
  });
};

module.exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ExpressError(400, "All fields are required");
  }

  const user = await User.findOne({ email });

  const dummyHash = "$2b$10$KbQiN6tL2v1x5n6m8n2zUeK7V6kGQz5u5X7gYJz7Kx7WJfV1dY9mG";

  if (!user) {

    await bcrypt.compare(
      password,
      dummyHash
    );

    throw new ExpressError(
      401,
      "Invalid credentials"
    );

  }
  //WHAT IS HAPPENING? Even if user missing: backend still performs bcrypt work. Now: timing becomes consistent. Professional auth hardening.

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ExpressError(400, "Invalid credentials");
  }

  const sessionId = Date.now().toString();
  user.activeSessionId = sessionId;
  await user.save();
  const token = jwt.sign(
    { userId: user._id, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(200).json({
    message: "Login successful",
    token,

    user: {
    id: user._id,
    email: user.email
  }
});
};