import { useEffect, useState } from "react";
import { getTasks } from "../api/taskApi";

function Dashboard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchTasks();
  }, []);

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