const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware/authMiddleware");
const taskController = require("../controllers/taskController");

router.post("/", isLoggedIn, wrapAsync(taskController.createTask));
router.get("/", isLoggedIn, wrapAsync(taskController.getTasks));
router.delete("/:id", isLoggedIn, wrapAsync(taskController.deleteTask));
router.put("/:id", isLoggedIn, wrapAsync(taskController.updateTask));

module.exports = router;