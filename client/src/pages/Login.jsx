import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../checkout.css";

export default function Login() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // already logged in as admin: go straight to the admin page
  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const data = await login(email.trim(), password);
      if (data.role !== "admin") {
        logout();
        setError("This account does not have admin access.");
        setSubmitting(false);
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not log in. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h2>Admin login</h2>

      <form className="co-form" onSubmit={handleSubmit} noValidate style={{ maxWidth: 400 }}>
        <label className="co-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="co-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="co-error">{error}</p>}

        <button className="co-submit" type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : "Log in"}
        </button>
      </form>
    </main>
  );
}