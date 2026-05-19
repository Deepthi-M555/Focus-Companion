const express = require("express");

const router = express.Router();

const {
  createTask
} = require("../controllers/taskController");

const {
  isLoggedIn
} = require("../middleware/authMiddleware");

const wrapAsync =
require("../utils/wrapAsync");

router.post(
  "/",
  isLoggedIn,
  wrapAsync(createTask)
);

module.exports = router;



// WHAT IS HAPPENING HERE?
// Request
// ↓
// JWT middleware
// ↓
// Authenticated user injected
// ↓
// Task controller executes