const {

    STATES,

    transition

} = require(
    "../services/focusStateMachine"
);

module.exports = (
    io,
    socket
) => {

    /*
        Join Session Room
    */

    socket.on(

        "join_focus_session",

        (sessionId) => {

            socket.join(
                sessionId
            );

            console.log(

                `Joined session:

                ${sessionId}`

            );

        }

    );

    /*
        Voice Check-In Response
    */

    socket.on(

        "voice-response",

        ({

            sessionId,

            transcript,

            currentState

        }) => {

            const text =
                transcript
                .toLowerCase();

            try {

                /*
                    YES
                */

                if (

                    text.includes(
                        "yes"
                    ) ||

                    text.includes(
                        "completed"
                    )

                ) {

                    const nextState =
                        transition({

                            currentState,

                            nextState:
                                STATES.COMPLETED

                        });

                    io.to(sessionId)

                        .emit(

                            "session-state",

                            {

                                state:
                                    nextState

                            }

                        );

                    return;
                }

                /*
                    SNOOZE
                */

                if (

                    text.includes(
                        "snooze"
                    )

                ) {

                    const nextState =
                        transition({

                            currentState,

                            nextState:
                                STATES.SNOOZED

                        });

                    io.to(sessionId)

                        .emit(

                            "session-state",

                            {

                                state:
                                    nextState

                            }

                        );

                    return;
                }

                /*
                    NEED HELP
                */

                const nextState =
                    transition({

                        currentState,

                        nextState:
                            STATES.RECOVERY_ENGINE

                    });

                io.to(sessionId)

                    .emit(

                        "session-state",

                        {

                            state:
                                nextState

                        }

                    );

            }

            catch (error) {

                socket.emit(

                    "session-error",

                    {

                        message:
                            error.message

                    }

                );

            }

        }

    );

};