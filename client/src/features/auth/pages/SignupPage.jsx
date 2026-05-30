import SignupForm
from "../components/SignupForm";

function SignupPage() {

  return (

    <div className="auth-page">

      <div className="auth-left">

        <h1>
          Join FYNIX
        </h1>

      </div>

      <div className="auth-right">

        <SignupForm />

      </div>

    </div>

  );

}

export default SignupPage;