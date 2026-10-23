import { Link, useLocation } from "react-router-dom";
import "../checkout.css";

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function OrderSuccess() {
  const { state } = useLocation();

  if (!state?.orderNumber) {
    return (
      <main>
        <h2>Order</h2>
        <p className="message">No recent order found.</p>
        <Link className="link" to="/shop">
          Continue shopping
        </Link>
      </main>
    );
  }

  const paidOnline = state.paymentMethod === "razorpay";

  return (
    <main>
      <h2>Order placed</h2>
      <div className="co-success">
        <p>Thank you. Your order has been received.</p>
        <p className="co-number">{state.orderNumber}</p>
        {paidOnline ? (
          <p>
            Payment received online: <strong>{money(state.total)}</strong>
          </p>
        ) : (
          <p>
            Total to pay on delivery: <strong>{money(state.total)}</strong>
          </p>
        )}
        <p className="co-note">
          Please note your order number. We will contact you on your mobile
          number to confirm the order.
        </p>
        <Link className="link" to="/shop">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}