import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

function App() {
  const token = localStorage.getItem("token");

  return (
    <div>
      {token ? <Dashboard /> : <LoginPage />}
    </div>
  );
}

export default App;whta