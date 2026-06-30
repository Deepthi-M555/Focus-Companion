const express = require("express");

const router = express.Router();

const analyticsController = require("../controllers/analyticsController");

const { isLoggedIn } = require("../middleware/authMiddleware");

router.get(
    "/",
    isLoggedIn,
    analyticsController.getAnalytics
);

module.exports = router;