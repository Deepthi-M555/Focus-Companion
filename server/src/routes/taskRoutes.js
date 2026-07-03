const express = require("express");

const router = express.Router();

const {
  createTask,
  saveSchedule,
  loadSchedule
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

router.post(
  "/save",
  isLoggedIn,
  wrapAsync(
    saveSchedule
  )
);

router.get(
  "/today",
  isLoggedIn,
  wrapAsync(
    loadSchedule
  )
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
