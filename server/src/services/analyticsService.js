function calculateFocusScore({

  focusedMinutes,

  plannedMinutes,

  distractions

}) {

  const completionRatio =

    focusedMinutes /
    plannedMinutes;

  const distractionPenalty =

    distractions * 0.05;

  const score =

    Math.max(
      0,
      (
        completionRatio
        - distractionPenalty
      ) * 100
    );

  return Math.floor(score);

}

module.exports = {
  calculateFocusScore
};