const express = require("express");

const router = express.Router();

const recoveryController =
require("../controllers/recoveryController");

const {
    isLoggedIn: authenticate
} = require("../middleware/authMiddleware");

router.get(
    "/summary",
    authenticate,
    recoveryController.summary
);

router.post(
    "/",
    authenticate,
    recoveryController.recover
);

router.post(
    "/skip",
    authenticate,
    recoveryController.skipAndResume
);

module.exports = router;