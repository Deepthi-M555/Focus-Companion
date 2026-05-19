const activeTimers =
new Map();

const startSessionTimer =
(io, sessionId, duration) => {

  const timer =
    setTimeout(() => {

      io.to(sessionId).emit(
        "CHECK_IN_REQUIRED",
        { sessionId }
      );

    }, duration * 60 * 1000);

  activeTimers.set(
    sessionId,
    timer
  );

};

const clearSessionTimer =
(sessionId) => {

  const timer =
    activeTimers.get(sessionId);

  if (timer) {

    clearTimeout(timer);

    activeTimers.delete(
      sessionId
    );

  }

};

module.exports = {

  startSessionTimer,

  clearSessionTimer

};


// WHAT IS HAPPENING?

// Server:

// orchestrates session lifecycle.

// NOT frontend.

// This is:

// authoritative backend timing.