const express = require("express");

const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

router.get(
  "/me",
  isLoggedIn,
  wrapAsync(userController.getCurrentUser)
);

module.exports = router;
