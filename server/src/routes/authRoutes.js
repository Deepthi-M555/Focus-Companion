const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const authController = require("../controllers/authController");

router.post("/signup", wrapAsync(authController.signup));
router.post("/login", wrapAsync(authController.login));

module.exports = router;