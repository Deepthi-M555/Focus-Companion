const express =
    require("express");

const router =
    express.Router();

const aiController =
    require(
        "../controllers/aiController"
    );

const aiGuardrail =
    require(
        "../middleware/aiGuardrail"
    );

router.post(
    "/chat",

    aiGuardrail,

    wrapAsync(
        aiController.chat
    )
);

const wrapAsync =
    require("../../utils/wrapAsync");

router.post(
    "/chat",
    wrapAsync(aiController.chat)
);

module.exports =
    router;