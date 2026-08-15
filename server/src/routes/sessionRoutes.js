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
    resumeSession ,
    pauseSession,
    resumePausedSession,
    completeSession
} = require("../controllers/sessionController");

router.post(
  "/start",
  isLoggedIn,
  wrapAsync(startSession)
);

router.get(
    "/resume",
    isLoggedIn,
    wrapAsync(resumeSession )
);
router.post(
  "/fail/:id",
  isLoggedIn,
  wrapAsync(failSession)
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
  "/complete/:id",
  isLoggedIn,
  wrapAsync(
    completeSession
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
failSession()

This makes:

analytics easier
logic cleaner
state transitions safer

THIS is good backend architecture.
*/
