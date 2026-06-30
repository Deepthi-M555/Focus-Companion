const express = require("express");

const router = express.Router();

const recoveryController =
require("../controllers/recoveryController");

const {
    isLoggedIn
} = require("../middleware/authMiddleware");

router.post(
    "/",
    isLoggedIn,
    recoveryController.recover
);

module.exports = router;