import { Link } from "react-router-dom";
import { STORE } from "../storeInfo";
import "../policy.css";

function Footer() {
  const hasContact = STORE.email || STORE.phone || STORE.hours;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h4>{STORE.name}</h4>
          <p>Football jerseys, delivered across India.</p>
        </div>

        <div>
          <h4>Help</h4>
          <Link to="/shipping">Shipping and delivery</Link>
          <Link to="/returns">Returns and exchange</Link>
        </div>

        {hasContact && (
          <div>
            <h4>Contact</h4>
            {STORE.email && <p>{STORE.email}</p>}
            {STORE.phone && <p>{STORE.phone}</p>}
            {STORE.hours && <p>{STORE.hours}</p>}
          </div>
        )}
      </div>

      <p className="footer-copy">
        © {new Date().getFullYear()} {STORE.name}. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;