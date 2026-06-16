const STATES = {

    IDLE: "IDLE",

    ACTIVE: "ACTIVE",

    CHECK_IN_PENDING:
        "CHECK_IN_PENDING",

    SNOOZED: "SNOOZED",

    COMPLETED: "COMPLETED",

    RECOVERY_ENGINE:
        "RECOVERY_ENGINE"

};

const transitions = {

    IDLE: [

        "ACTIVE"

    ],

    ACTIVE: [

        "CHECK_IN_PENDING"

    ],

    CHECK_IN_PENDING: [

        "COMPLETED",

        "SNOOZED",

        "RECOVERY_ENGINE"

    ],

    SNOOZED: [

        "ACTIVE",

        "RECOVERY_ENGINE"

    ],

    RECOVERY_ENGINE: [

        "ACTIVE",

        "COMPLETED"

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