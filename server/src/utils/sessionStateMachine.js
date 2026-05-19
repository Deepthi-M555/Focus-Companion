const transitions = {

  scheduled: [
    "active"
  ],

  active: [
    "check_in_pending",
    "failed",
    "snoozed"
  ],

  check_in_pending: [
    "completed",
    "failed",
    "snoozed"
  ],

  snoozed: [
    "active",
    "failed"
  ],

  completed: [],

  failed: []

};

const canTransition =
(current, next) => {

  return transitions[
    current
  ]?.includes(next);

};

module.exports = {
  canTransition
};