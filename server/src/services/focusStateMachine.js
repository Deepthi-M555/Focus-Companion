const STATES = {

    IDLE: "idle",

    ACTIVE: "active",

    CHECK_IN_PENDING:
        "check_in_pending",

    SNOOZED: "snoozed",

    COMPLETED: "completed",

    RECOVERY_ENGINE:
        "recovery"

};

const transitions = {

    idle: [

        "active"

    ],

    active: [

        "check_in_pending"

    ],

    check_in_pending: [

        "completed",

        "snoozed",

        "recovery"

    ],

    snoozed: [

        "active",

        "check_in_pending",

        "recovery"

    ],

    recovery: [

        "active",

        "completed"

    ]

};

function transition({

    currentState,

    nextState

}) {

    const allowed =
        transitions[currentState];

    if (

        !allowed ||

        !allowed.includes(
            nextState
        )

    ) {

        throw new Error(

            `Invalid Transition:

            ${currentState}

            →

            ${nextState}`

        );

    }

    return nextState;

}

module.exports = {

    STATES,

    transition

};
