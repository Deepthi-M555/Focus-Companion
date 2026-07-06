const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");
const aiGuardrail = require("../middleware/aiGuardrail");
const wrapAsync = require("../../utils/wrapAsync");
const { isLoggedIn } = require("../../middleware/authMiddleware");

router.use(isLoggedIn);

router.post(
    "/chat",
    aiGuardrail,
    wrapAsync(aiController.chat)
);

router.post(
    "/study-goal",
    aiGuardrail,
    wrapAsync(aiController.addStudyGoal)
);

module.exports = router;
