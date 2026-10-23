import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "../checkout.css";
import "../admin.css";
import "../admin-list.css";

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const totalStock = (jersey) =>
  (jersey.sizes || []).reduce((sum, row) => sum + (row.stock || 0), 0);

export default function AdminJerseyList() {
  const [jerseys, setJerseys] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/jerseys", { params: { limit: 50, sort: "newest" } })
      .then(({ data }) => {
        const list = data.jerseys || [];
        setJerseys(list);
        setTotal(data.total ?? list.length);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not load the jerseys.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (jersey) => {
    if (!window.confirm(`Delete "${jersey.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/jerseys/${jersey._id}`);
      setJerseys((list) => list.filter((j) => j._id !== jersey._id));
      setTotal((t) => t - 1);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete the jersey.");
    }
  };

  return (
    <main>
      <h2>Jerseys ({total})</h2>
      <p className="message">
        <Link to="/admin" className="link">
          Back to admin
        </Link>
      </p>

      <div className="ad-links">
        <Link className="ad-link" to="/admin/jerseys/new">
          Add jersey
        </Link>
      </div>

      {error && <p className="co-error">{error}</p>}
      {loading && <p className="message">Loading...</p>}

      {!loading && jerseys.length === 0 && !error && (
        <p className="message">No jerseys yet.</p>
      )}

      {jerseys.length > 0 && (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Team</th>
                <th>Version</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {jerseys.map((jersey) => (
                <tr key={jersey._id}>
                  <td>{jersey.name}</td>
                  <td>{jersey.team}</td>
                  <td>{jersey.version}</td>
                  <td>
                    {jersey.salePrice && jersey.salePrice < jersey.price ? (
                      <>
                        {money(jersey.salePrice)}
                        <span className="ad-was">{money(jersey.price)}</span>
                      </>
                    ) : (
                      money(jersey.price)
                    )}
                  </td>
                  <td>{totalStock(jersey)}</td>
                  <td>
                    <div className="ad-actions">
                      <Link
                        className="ad-small"
                        to={`/admin/jerseys/${jersey._id}/edit`}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="ad-small quiet"
                        onClick={() => handleDelete(jersey)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}