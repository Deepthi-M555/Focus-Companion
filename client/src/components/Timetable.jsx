function Timetable({ schedule }) {
  if (!schedule || schedule.length === 0) return null;

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Your Plan</h3>

      {schedule.map((item, index) => (
        <div
          key={index}
          style={{
            background: "#fff",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <strong>{item.task}</strong>
          <p>{item.duration} hrs</p>
        </div>
      ))}
    </div>
  );
}

export default Timetable;