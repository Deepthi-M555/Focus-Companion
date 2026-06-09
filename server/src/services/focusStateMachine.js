const STATES = {

  IDLE: "IDLE",

  ACTIVE: "ACTIVE",

  CHECK_IN_PENDING:
    "CHECK_IN_PENDING",

  COMPLETED: "COMPLETED"

};

const transitions = {

  IDLE: ["ACTIVE"],

  ACTIVE: [
    "CHECK_IN_PENDING"
  ],

  CHECK_IN_PENDING: [
    "COMPLETED",
    "ACTIVE"
  ]

};

function transition({

  currentState,

  nextState

}) {

  const allowed =

    transitions[currentState];

  if (
    !allowed.includes(
      nextState
    )
  ) {

    throw new Error(
      "Invalid Transition"
    );

  }

  return nextState;

}

module.exports = {

  STATES,

  transition

};