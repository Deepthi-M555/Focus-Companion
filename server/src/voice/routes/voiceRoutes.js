const express =
    require("express");

const router =
    express.Router();

const wrapAsync =
    require("../../utils/wrapAsync");

const {
    processVoice
} = require(
    "../controllers/voiceController"
);

router.post(
    "/intent",
    wrapAsync(
        processVoice
    )
);

module.exports =
    router;