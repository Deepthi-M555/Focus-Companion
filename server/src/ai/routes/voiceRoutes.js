const express =
    require("express");

const router =
    express.Router();

const {

    transcribe

} = require(
    "../controllers/voiceController"
);

router.post(

    "/transcribe",

    transcribe

);

module.exports =
    router;