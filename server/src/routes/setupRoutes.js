const express = require("express");

const router = express.Router();

const wrapAsync = require("../utils/wrapAsync");

const { isLoggedIn } =
require("../middleware/authMiddleware");

const setupController =
require("../controllers/setupController");

router.post(
    "/",
    isLoggedIn,
    wrapAsync(setupController.saveSetup)
);

router.get(
    "/",
    isLoggedIn,
    wrapAsync(setupController.getSetup)
);

module.exports = router;