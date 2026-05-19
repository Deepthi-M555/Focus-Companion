const express =
require("express");

const router =
express.Router();

const wrapAsync =
require("../utils/wrapAsync");

const {
  isLoggedIn
} = require(
  "../middleware/authMiddleware"
);

const {
  startSession,
  completeSession,
  failSession,
  snoozeSession
} = require(
  "../controllers/sessionController"
);

router.post(
  "/start",
  isLoggedIn,
  wrapAsync(startSession)
);

router.post(
  "/complete/:id",
  isLoggedIn,
  wrapAsync(completeSession)
);

router.post(
  "/fail/:id",
  isLoggedIn,
  wrapAsync(failSession)
);

router.post(
  "/snooze/:id",
  isLoggedIn,
  wrapAsync(snoozeSession)
);

module.exports = router;

/*WHAT IS HAPPENING?

You are defining:

behavioral state transition endpoints.

Not CRUD.

VERY important.

WHY THIS IS IMPORTANT

Instead of:

updateSession()

you now create:

explicit behavioral actions.

Example:

completeSession()
failSession()
snoozeSession()

This makes:

analytics easier
logic cleaner
state transitions safer

THIS is good backend architecture.
*/