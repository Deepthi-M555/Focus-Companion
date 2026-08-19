const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const authController = require("../controllers/authController");

const redisRateLimit =
    require(
        "../middleware/redisRateLimit"
    );
    
router.post("/signup", wrapAsync(authController.signup));
router.post(
    "/login",

    redisRateLimit({
        windowSeconds: 60,
        maxRequests: 10,
        keyPrefix: "login"
    }),

    wrapAsync(
        authController.login
    )
);
module.exports = router;