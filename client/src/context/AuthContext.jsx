import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);
const STORAGE_KEY = "false9-user";

const readSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSaved);
  // true only while we check a saved token with the server
  const [loading, setLoading] = useState(Boolean(readSaved()));

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  useEffect(() => {
    if (!readSaved()) return;

    api
      .get("/auth/me")
      .catch((err) => {
        // 401 means the token is old or wrong: log out.
        // No response at all means the server is down: keep the login.
        if (err.response?.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}