import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminJerseyList from "./pages/AdminJerseyList";
import AdminJerseyForm from "./pages/AdminJerseyForm";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import JerseyDetail from "./pages/JerseyDetail";
import Footer from "./components/Footer";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent() {
  const { totalItems } = useCart();
  const { user } = useAuth();

  return (
    <>
      <ScrollToTop />
      <header className="header">
        <Link to="/" className="logo">
          <h1>
            <img src="/images/false9-logo.png" alt="False 9" className="logo-img" />
          </h1>
        </Link>

        <nav className="nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/shop">Shop</NavLink>
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          <NavLink to="/cart" className="cart-count">
            Cart ({totalItems})
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/jersey/:id" element={<JerseyDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/returns" element={<Returns />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jerseys"
          element={
            <AdminRoute>
              <AdminJerseyList />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jerseys/new"
          element={
            <AdminRoute>
              <AdminJerseyForm key="new" />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jerseys/:id/edit"
          element={
            <AdminRoute>
              <AdminJerseyForm key="edit" />
            </AdminRoute>
          }
        />
                <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <AdminRoute>
              <AdminOrderDetail />
            </AdminRoute>
          }
        />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;