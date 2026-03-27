const BASE_URL = "http://localhost:5000/api/tasks";

export const getTasks = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data.tasks;
};