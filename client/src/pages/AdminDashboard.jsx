import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../admin.css";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main>
      <h2>Admin</h2>
      <p>Logged in as {user.name}.</p>

      <div className="ad-links">
        <Link className="ad-link" to="/admin/orders">
          Orders
        </Link>
        <Link className="ad-link" to="/admin/jerseys">
          Manage jerseys
        </Link>
        <Link className="ad-link" to="/admin/jerseys/new">
          Add jersey
        </Link>
      </div>

      <button type="button" className="ad-logout" onClick={handleLogout}>
        Log out
      </button>
    </main>
  );
}