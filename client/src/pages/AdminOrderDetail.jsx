import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import "../checkout.css";
import "../admin.css";
import "../admin-list.css";
import "../admin-orders.css";

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// The same rules as the server. The server is the one that really enforces them.
const NEXT_STATUSES = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export default function AdminOrderDetail() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .catch((err) => {
        setError(err.response?.data?.message || "Could not load this order.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    if (!nextStatus || saving) return;

    if (
      nextStatus === "cancelled" &&
      !window.confirm("Cancel this order? The stock will be put back.")
    ) {
      return;
    }

    setSaving(true);
    setUpdateError("");
    setNotice("");

    try {
      const { data } = await api.put(`/orders/${id}/status`, {
        orderStatus: nextStatus,
      });
      setOrder(data.order);
      setNotice(
        `Status changed to ${data.order.orderStatus}.${data.note ? " " + data.note : ""}`
      );
      setNextStatus("");
    } catch (err) {
      setUpdateError(
        err.response?.data?.message || "Could not update the order."
      );
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <main>
        <p className="message">Loading...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main>
        <h2>Order</h2>
        <p className="co-error">{error || "Order not found."}</p>
        <p className="message">
          <Link to="/admin/orders" className="link">
            Back to orders
          </Link>
        </p>
      </main>
    );
  }

  const allowed = NEXT_STATUSES[order.orderStatus] || [];

  return (
    <main>
      <h2>{order.orderNumber}</h2>
      <p className="message">
        <Link to="/admin/orders" className="link">
          Back to orders
        </Link>
      </p>

      <p>
        Placed on{" "}
        {new Date(order.createdAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })}{" "}
        · <span className={`or-status ${order.orderStatus}`}>{order.orderStatus}</span>
      </p>

      <div className="or-grid">
        <div className="or-box">
          <h3>Customer</h3>
          <p>{order.customer?.name}</p>
          <p>{order.customer?.phone}</p>
          {order.customer?.email && <p>{order.customer.email}</p>}
          <h3 style={{ marginTop: 16 }}>Delivery address</h3>
          <p>{order.address?.line1}</p>
          <p>
            {order.address?.city}, {order.address?.state}
          </p>
          <p>{order.address?.pincode}</p>
        </div>

        <div className="or-box">
          <h3>Payment</h3>
          <p>
            Method:{" "}
            {order.paymentMethod === "cod" ? "Cash on delivery" : "Online (Razorpay)"}
          </p>
          <p>Payment status: {order.paymentStatus}</p>
          {order.razorpayPaymentId && <p>Payment id: {order.razorpayPaymentId}</p>}
          {order.razorpayOrderId && <p>Razorpay order: {order.razorpayOrderId}</p>}
        </div>
      </div>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Jersey</th>
              <th>Size</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={`${item.jersey}-${item.size}-${index}`}>
                <td>
                  {item.name}
                  <br />
                  <span className="ad-was" style={{ textDecoration: "none", marginLeft: 0 }}>
                    {item.team}
                  </span>
                </td>
                <td>{item.size}</td>
                <td>{item.quantity}</td>
                <td>{money(item.price)}</td>
                <td>{money(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="or-totals">
        <div>
          <span>Items</span>
          <span>{money(order.itemsTotal)}</span>
        </div>
        <div>
          <span>Delivery</span>
          <span>{money(order.shippingFee)}</span>
        </div>
        <div className="or-grand">
          <span>Total</span>
          <span>{money(order.total)}</span>
        </div>
      </div>

      {notice && <p className="ad-success">{notice}</p>}

      <div className="or-update">
        <strong>Update status</strong>
        {allowed.length === 0 ? (
          <p className="message" style={{ textAlign: "left" }}>
            This order is {order.orderStatus}, so its status cannot be changed.
          </p>
        ) : (
          <>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
            >
              <option value="">Choose the next status</option>
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {updateError && <p className="co-error">{updateError}</p>}
            <button
              type="button"
              className="co-submit"
              style={{ marginTop: 0 }}
              onClick={handleUpdate}
              disabled={!nextStatus || saving}
            >
              {saving ? "Please wait..." : "Update status"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}