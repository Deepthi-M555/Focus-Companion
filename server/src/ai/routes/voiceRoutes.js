const express =
    require("express");

const router =
    express.Router();

const {

    transcribe

} = require(
    "../controllers/voiceController"
);

const { isLoggedIn } = require("../../middleware/authMiddleware");

router.post(

    "/transcribe",

    isLoggedIn,

    transcribe

);

module.exports =
    router;
