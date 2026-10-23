import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "../checkout.css";
import "../admin.css";
import "../admin-list.css";
import "../admin-orders.css";

const STATUSES = ["placed", "confirmed", "shipped", "delivered", "cancelled"];

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const paymentLabel = (order) =>
  order.paymentMethod === "cod"
    ? "Cash on delivery"
    : `Online, ${order.paymentStatus}`;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    api
      .get("/orders", {
        params: { status: status || undefined, q: q || undefined, page, limit: 20 },
      })
      .then(({ data }) => {
        if (ignore) return;
        setOrders(data.orders || []);
        setPages(data.pages || 1);
        setTotal(data.total ?? 0);
        setError("");
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.response?.data?.message || "Could not load the orders.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [status, q, page]);

  const chooseStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQ(searchText.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setSearchText("");
    setQ("");
    setPage(1);
  };

  return (
    <main>
      <h2>Orders ({total})</h2>
      <p className="message">
        <Link to="/admin" className="link">
          Back to admin
        </Link>
      </p>

      <div className="or-filters">
        <button
          type="button"
          className={`or-filter${status === "" ? " active" : ""}`}
          onClick={() => chooseStatus("")}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`or-filter${status === s ? " active" : ""}`}
            onClick={() => chooseStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <form className="or-search" onSubmit={handleSearch}>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Order number or mobile number"
        />
        <button type="submit" className="ad-small">
          Search
        </button>
        {q && (
          <button type="button" className="ad-small quiet" onClick={clearSearch}>
            Clear
          </button>
        )}
      </form>

      {error && <p className="co-error">{error}</p>}
      {loading && <p className="message">Loading...</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="message">No orders found.</p>
      )}

      {orders.length > 0 && (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>City</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    {order.customer?.name}
                    <br />
                    <span className="ad-was" style={{ textDecoration: "none", marginLeft: 0 }}>
                      {order.customer?.phone}
                    </span>
                  </td>
                  <td>{order.address?.city}</td>
                  <td>{paymentLabel(order)}</td>
                  <td>{money(order.total)}</td>
                  <td>
                    <span className={`or-status ${order.orderStatus}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td>
                    <Link className="ad-small" to={`/admin/orders/${order._id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="or-pager">
          <button
            type="button"
            className="ad-small"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className="ad-small"
            onClick={() => setPage(page + 1)}
            disabled={page >= pages}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}