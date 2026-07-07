const transitions = {

  scheduled: [
    "active"
  ],

  active: [
    "check_in_pending",
    "paused",
    "snoozed"
  ],

  paused: [
    "active",
    "recovery"
  ],

  check_in_pending: [
    "completed",
    "snoozed",
    "recovery"
  ],

  snoozed: [
    "active",
    "recovery"
  ],

  completed: [],

  recovery: [],

  skipped: []

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