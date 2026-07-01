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

const settingsController =
require("../controllers/settingsController");

router.get(
    "/",
    isLoggedIn,
    wrapAsync(
        settingsController.getSettings
    )
);

router.put(
    "/profile",
    isLoggedIn,
    wrapAsync(
        settingsController.updateProfile
    )
);

router.put(
    "/preferences",
    isLoggedIn,
    wrapAsync(
        settingsController.updatePreferences
    )
);

router.put(
    "/password",
    isLoggedIn,
    wrapAsync(
        settingsController.changePassword
    )
);

module.exports =
router;