const FocusSession =
require("../models/FocusSession");

const SessionEvent =
require("../models/SessionEvent");

module.exports = (
    io,
    socket
) => {
    socket.on(
        "check-in-response",
        async ({
            sessionId,
            completed,
            transcript
        }) => {
            const session =
                await FocusSession.findById(
                    sessionId
                );
            if (!session) {
                return;
            }
            if (completed) {
                session.status =
                    "completed";
                session.endedAt =
                    new Date();
                session.actualDuration =
                    session.plannedDuration;
                session.completedBy =
                    "USER";
                await session.save();
                await SessionEvent.create({
                    session: session._id,
                    user: session.user,
                    type: "CHECK_IN",
                    metadata: {
                        transcript
                    }
                });
                await SessionEvent.create({
                    session: session._id,
                    user: session.user,
                    type: "SESSION_COMPLETE"
                });
                io.to(sessionId).emit(
                    "session-completed"
                );
                return
            }
            session.status =
                "failed";
            session.endedAt =
                new Date();
            session.completedBy =
                "TIMEOUT";
            await session.save();
            await SessionEvent.create({
                session: session._id,
                user: session.user,
                type: "SESSION_FAIL"
            });
            io.to(sessionId).emit(
                "session-failed"
            );
        }
    );
};