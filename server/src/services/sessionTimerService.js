const activeTimers =
new Map();

/*
  START SESSION TIMER

  After the focus duration
  expires:

  Trigger a check-in event.

  Server remains the
  source of truth.
*/

const startSessionTimer =
(io, sessionId, duration) => {

  const timer =
    setTimeout(() => {

      io.to(sessionId).emit(

        "show-check-in",

        {

          sessionId,

          status:
            "CHECK_IN_REQUIRED"

        }

      );

    },

    duration *
    60 *
    1000

    );

  activeTimers.set(

    sessionId,

    timer

  );

};

/*
  CLEAR SESSION TIMER

  Used when:

  - Session completes
  - Session pauses
  - Session cancels

  Prevents duplicate
  check-ins.
*/

const clearSessionTimer =
(sessionId) => {

  const timer =
    activeTimers.get(
      sessionId
    );

  if (timer) {

    clearTimeout(
      timer
    );

    activeTimers.delete(
      sessionId
    );

  }

};

module.exports = {

  startSessionTimer,

  clearSessionTimer

};

/*
  WHAT IS HAPPENING?

  Focus Session Started
            ↓
      Timer Created
            ↓
     Stored In Map
            ↓
      Duration Ends
            ↓
   show-check-in Event
            ↓
      Client Popup
            ↓
  User Response Flow

  The Backend Controls Time.

  NOT React.

  NOT Electron.

  This makes the server
  authoritative for
  focus lifecycle.
*/