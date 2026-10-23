import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import "../checkout.css";

// Display only. The server decides the real delivery charge.
const SHIPPING_FEE = 10;

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// Loads Razorpay's payment window script once, only when needed
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// Tells the server the customer did not pay, so the stock is put back
const cancelOnlineOrder = async (orderId) => {
  try {
    await api.post("/orders/cancel", { orderId });
  } catch (err) {
    // nothing more to do here
  }
};

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      return "Please enter a valid 10-digit Indian mobile number.";
    if (!form.line1.trim()) return "Please enter your address.";
    if (!form.city.trim()) return "Please enter your city.";
    if (!form.state.trim()) return "Please enter your state.";
    if (!/^\d{6}$/.test(form.pincode.trim()))
      return "Please enter a valid 6-digit pincode.";
    return "";
  };

  const goToSuccess = (orderNumber, total, method) => {
    clearCart();
    navigate("/order-success", {
      replace: true,
      state: { orderNumber, total, paymentMethod: method },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setSubmitting(true);

    const customer = { name: form.name.trim(), phone: form.phone.trim() };
    if (form.email.trim()) customer.email = form.email.trim();

    const payload = {
      items: items.map((item) => ({
        jerseyId: item.jerseyId,
        size: item.size,
        quantity: item.quantity,
      })),
      customer,
      address: {
        line1: form.line1.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      },
      paymentMethod,
    };

    let data;
    try {
      const response = await api.post("/orders", payload);
      data = response.data;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not place the order. Please try again."
      );
      setSubmitting(false);
      return;
    }

    // cash on delivery: the order is complete
    if (paymentMethod === "cod") {
      goToSuccess(data.orderNumber, data.total, "cod");
      return;
    }

    // online payment: open the Razorpay window
    const loaded = await loadRazorpayScript();
    if (!loaded || !data.razorpay) {
      await cancelOnlineOrder(data._id);
      setError("Could not open the payment window. Check your internet and try again.");
      setSubmitting(false);
      return;
    }

    let completed = false;

    const options = {
      key: data.razorpay.keyId,
      amount: data.razorpay.amount,
      currency: data.razorpay.currency,
      name: "False 9",
      description: `Order ${data.orderNumber}`,
      order_id: data.razorpay.orderId,
      prefill: {
        name: customer.name,
        contact: customer.phone,
        email: customer.email,
      },
      theme: { color: "#000000" },
      handler: async (response) => {
        completed = true;
        try {
          await api.post("/orders/verify", {
            orderId: data._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          goToSuccess(data.orderNumber, data.total, "razorpay");
        } catch (err) {
          setError(
            `Your payment was received, but we could not confirm it yet. Please note your order number ${data.orderNumber} and contact us.`
          );
          setSubmitting(false);
        }
      },
      modal: {
        ondismiss: async () => {
          if (completed) return;
          await cancelOnlineOrder(data._id);
          setError("Payment was cancelled, so your order was not placed.");
          setSubmitting(false);
        },
      },
    };

    const paymentWindow = new window.Razorpay(options);
    paymentWindow.on("payment.failed", (response) => {
      setError(
        response.error?.description || "Payment failed. Please try again."
      );
    });
    paymentWindow.open();
  };

  if (items.length === 0) {
    return (
      <main>
        <h2>Checkout</h2>
        <p className="message">Your cart is empty.</p>
        <Link className="link" to="/shop">
          Continue shopping
        </Link>
      </main>
    );
  }

  const total = subtotal + SHIPPING_FEE;

  return (
    <main>
      <h2>Checkout</h2>

      <div className="co-layout">
        <form className="co-form" onSubmit={handleSubmit} noValidate>
          <h3 className="co-heading">Contact</h3>
          <div className="co-row">
            <label className="co-field">
              <span>Full name</span>
              <input name="name" value={form.name} onChange={handleChange} />
            </label>
            <label className="co-field">
              <span>Mobile number</span>
              <input
                name="phone"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={handleChange}
              />
            </label>
          </div>
          <label className="co-field">
            <span>Email (optional)</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <h3 className="co-heading">Delivery address</h3>
          <label className="co-field">
            <span>Address</span>
            <input name="line1" value={form.line1} onChange={handleChange} />
          </label>
          <div className="co-row">
            <label className="co-field">
              <span>City</span>
              <input name="city" value={form.city} onChange={handleChange} />
            </label>
            <label className="co-field">
              <span>State</span>
              <input name="state" value={form.state} onChange={handleChange} />
            </label>
          </div>
          <label className="co-field">
            <span>Pincode</span>
            <input
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={handleChange}
            />
          </label>

          <h3 className="co-heading">Payment</h3>
          <label
            className={`co-pay-option ${paymentMethod === "razorpay" ? "active" : ""}`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="razorpay"
              checked={paymentMethod === "razorpay"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span className="co-pay-text">
              <strong>Pay online</strong>
              <span>UPI, cards and netbanking through Razorpay.</span>
            </span>
          </label>
          <label
            className={`co-pay-option ${paymentMethod === "cod" ? "active" : ""}`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span className="co-pay-text">
              <strong>Cash on delivery</strong>
              <span>Pay in cash when your jersey arrives.</span>
            </span>
          </label>

          {error && <p className="co-error">{error}</p>}

          <button className="co-submit" type="submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : paymentMethod === "razorpay"
              ? `Pay ${money(total)}`
              : "Place order"}
          </button>
        </form>

        <aside className="co-summary">
          <h3 className="co-heading">Order summary</h3>
          {items.map((item) => (
            <div className="co-item" key={`${item.jerseyId}-${item.size}`}>
              <div className="co-item-info">
                <strong>{item.name}</strong>
                <span>
                  Size {item.size} · Qty {item.quantity}
                </span>
              </div>
              <span>{money(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="co-line">
            <span>Items</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="co-line">
            <span>Delivery</span>
            <span>{money(SHIPPING_FEE)}</span>
          </div>
          <div className="co-line co-total">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}