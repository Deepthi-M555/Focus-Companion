function LoginForm() {

  return (

    <form className="login-form">

      <input
        type="email"
        placeholder="Email"
      />

      <input
        type="password"
        placeholder="Password"
      />

      <button>
        Login
      </button>

      <button type="button">

        Continue with Google

      </button>

    </form>

  );

}

export default LoginForm;