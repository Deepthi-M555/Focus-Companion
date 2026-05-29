function SignupForm() {

  return (

    <form className="signup-form">

      <input
        type="email"
        placeholder="Email"
      />

      <input
        type="password"
        placeholder="Password"
      />

      <button>
        Signup
      </button>

    </form>

  );

}

export default SignupForm;