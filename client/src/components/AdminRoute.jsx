import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap any admin page with this. The server still checks the role on every request.
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main>
        <p className="message">Loading...</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}