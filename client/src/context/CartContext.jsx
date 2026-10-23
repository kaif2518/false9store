import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "false9-cart";

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  // keep a copy in the browser so the cart survives a refresh
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage can fail in private mode; the cart still works until refresh
    }
  }, [items]);

  const addItem = (jersey, size, stock) => {
    const price =
      jersey.salePrice && jersey.salePrice < jersey.price
        ? jersey.salePrice
        : jersey.price;

    setItems((current) => {
      const existing = current.find(
        (item) => item.jerseyId === jersey._id && item.size === size
      );

      if (existing) {
        return current.map((item) =>
          item === existing
            ? { ...item, quantity: Math.min(item.quantity + 1, stock), maxStock: stock }
            : item
        );
      }

      return [
        ...current,
        {
          jerseyId: jersey._id,
          name: jersey.name,
          team: jersey.team,
          size,
          price,
          image: jersey.images[0] || "",
          quantity: 1,
          maxStock: stock,
        },
      ];
    });
  };

  const updateQuantity = (jerseyId, size, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.jerseyId === jerseyId && item.size === size
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock)) }
          : item
      )
    );
  };

  const removeItem = (jerseyId, size) => {
    setItems((current) =>
      current.filter((item) => !(item.jerseyId === jerseyId && item.size === size))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}