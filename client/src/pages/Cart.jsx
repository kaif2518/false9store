import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../checkout.css";

const money = (amount) => `₹${amount.toLocaleString("en-IN")}`;

function Cart() {
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <main>
        <h2>Your cart</h2>
        <p className="message">Your cart is empty.</p>
        <p className="message">
          <Link to="/shop" className="link">
            Continue shopping
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h2>Your cart ({totalItems})</h2>

      <div className="cart-list">
        {items.map((item) => (
          <div className="cart-row" key={`${item.jerseyId}-${item.size}`}>
            <div className="cart-thumb">
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <span>No image</span>
              )}
            </div>

            <div className="cart-info">
              <p className="cart-name">{item.name}</p>
              <p className="cart-meta">
                {item.team} • Size {item.size}
              </p>
              <p className="cart-meta">{money(item.price)} each</p>
            </div>

            <div className="cart-qty">
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.jerseyId, item.size, item.quantity - 1)
                }
                disabled={item.quantity <= 1}
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.jerseyId, item.size, item.quantity + 1)
                }
                disabled={item.quantity >= item.maxStock}
              >
                +
              </button>
            </div>

            <p className="cart-line">{money(item.price * item.quantity)}</p>

            <button
              type="button"
              className="cart-remove"
              onClick={() => removeItem(item.jerseyId, item.size)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <p>
          Subtotal <strong>{money(subtotal)}</strong>
        </p>
        <button
          type="button"
          className="co-submit"
          onClick={() => navigate("/checkout")}
        >
          Checkout
        </button>
        <Link to="/shop" className="link">
          Continue shopping
        </Link>
      </div>
    </main>
  );
}

export default Cart;