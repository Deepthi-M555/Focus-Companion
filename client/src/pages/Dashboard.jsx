import { useEffect, useState } from "react";

function Dashboard() {
  const [tasks, setTasks] = useState([]);

  return (
    <div>
      <h1>Dashboard</h1>

      {tasks.length === 0 ? (
        <p>No tasks yet</p>
      ) : (
        tasks.map((task) => (
          <div key={task._id}>
            <h3>{task.title}</h3>
            <p>Duration: {task.duration} mins</p>
            <p>Priority: {task.priority}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard;