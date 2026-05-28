function AnalyticsDashboard({
  analytics
}) {

  return (

    <div className="analytics-dashboard">

      <div className="analytics-card">

        <h2>
          Focus Score
        </h2>

        <p>
          {
            analytics.focusIntegrityScore
          }
        </p>

      </div>

      <div className="analytics-card">

        <h2>
          Focused Minutes
        </h2>

        <p>
          {
            analytics.totalFocusedMinutes
          }
        </p>

      </div>

    </div>

  );

}

export default AnalyticsDashboard;