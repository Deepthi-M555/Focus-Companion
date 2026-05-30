import LoginForm
from "../components/LoginForm";

function LoginPage() {

  return (

    <div className="auth-page">

      <div className="auth-left">

        <h1>
          Welcome Back
        </h1>

        <p>
          Your AI Productivity Companion
        </p>

      </div>

      <div className="auth-right">

        <LoginForm />

      </div>

    </div>

  );

}

export default LoginPage;