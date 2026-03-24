import LoginPage from "./pages/LoginPage";

function App() {
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div>
      {token ? (
        <>
          <h1>Dashboard</h1>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <LoginPage />
      )}
    </div>
  );
}

export default App;