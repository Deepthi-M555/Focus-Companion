const express =
require("express");

const router =
express.Router();

const scheduleController =
require(
  "../controllers/scheduleController"
);

const {
  isLoggedIn
} =
require(
  "../middleware/authMiddleware"
);

router.get(

  "/generate",

  isLoggedIn,

  scheduleController.generate

);

module.exports =
router;