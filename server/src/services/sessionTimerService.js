const FocusSession =
require("../models/FocusSession");

const activeTimers =
new Map();

/*
  START SESSION TIMER

  Starts a backend timer for the
  current focus session.

  When the timer expires:

  1. Update session status
  2. Notify frontend
  3. Remove timer from memory
*/

const startSessionTimer =
(io, sessionId, duration) => {
    const timer =
        setTimeout(async () => {
            try {
                await FocusSession.findByIdAndUpdate(
                    sessionId,
                    {
                        status:
                            "check_in_pending"
                    },
                    {
                      new: true
                    }
                );
                io.to(sessionId).emit(
                    "show-check-in",
                    {
                        sessionId,
                        status:
                            "CHECK_IN_REQUIRED"
                    }
                );
            } catch (error) {
                console.error(
                    "Session Timer Error:",
                    error
                );
            } finally {
                activeTimers.delete(
                    sessionId
                );
            }
        },
        duration * 60 * 1000
        );
    activeTimers.set(
        sessionId,
        timer
    );
};

/*
  CLEAR SESSION TIMER

  Used when:

  - Session completed
  - Session failed
  - Session snoozed
  - Session cancelled

  Prevents duplicate timers.
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
     Stored In Memory
            ↓
      Timer Expires
            ↓
  Update Session Status
            ↓
   Emit show-check-in
            ↓
     Frontend Popup
            ↓
     User Responds

  The backend owns
  session timing.

  React only displays
  the current state.
*/