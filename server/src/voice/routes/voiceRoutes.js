const express =
    require("express");

const router =
    express.Router();

const wrapAsync =
    require("../../utils/wrapAsync");

const upload =
    require("../services/uploadService");

const {
    processVoice
} = require(
    "../controllers/voiceController"
);

const {
    isLoggedIn
} = require(
    "../../middleware/authMiddleware"
);

router.post(
    "/checkin",
    isLoggedIn,
    upload.single("audio"),
    wrapAsync(
        processVoice
    )
);

module.exports =
    router;