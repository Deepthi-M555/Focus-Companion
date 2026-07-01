const express =
require("express");

const router =
express.Router();

const wrapAsync =
require("../utils/wrapAsync");

const {
    isLoggedIn
} = require(
    "../middleware/authMiddleware"
);

const {
    getAnalytics
} = require(
    "../controllers/analyticsController"
);

router.get(
    "/",
    isLoggedIn,
    wrapAsync(getAnalytics)
);

module.exports =
router;