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
    failSession,
    resumeActiveSession,
    pauseSession,
    resumePausedSession,
    skipSession
} = require("../controllers/sessionController");

router.post(
  "/start",
  isLoggedIn,
  wrapAsync(startSession)
);

router.post(
  "/fail/:id",
  isLoggedIn,
  wrapAsync(failSession)
);

router.get(
    "/resume",
    isLoggedIn,
    wrapAsync(resumeActiveSession)
);

router.post(
  "/pause/:id",
  isLoggedIn,
  wrapAsync(
    pauseSession
  )
);

router.post(
  "/resume/:id",
  isLoggedIn,
  wrapAsync(
    resumePausedSession
  )
);

router.post(
  "/skip/:id",
  isLoggedIn,
  wrapAsync(
    skipSession
  )
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

Example:

startSession()
pauseSession()
resumePausedSession()
skipSession()
failSession()

This makes:

analytics easier
logic cleaner
state transitions safer

THIS is good backend architecture.
*/
