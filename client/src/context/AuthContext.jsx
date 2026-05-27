import {
  createContext,
  useState
} from "react";

export const AuthContext =
createContext();

function AuthProvider({
  children
}) {

  const [token, setToken] =
    useState(null);

  const [user, setUser] =
    useState(null);

  return (

    <AuthContext.Provider
      value={{
        token,
        setToken,
        user,
        setUser
      }}
    >

      {children}

    </AuthContext.Provider>

  );

}

export default AuthProvider;