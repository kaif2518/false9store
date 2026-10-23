import ContactLine from "../components/ContactLine";
import "../policy.css";

// Change this line when your delivery promise changes.
const DELIVERY_TIME = "5 to 7 days";

function Shipping() {
  return (
    <main>
      <h2>Shipping and delivery</h2>

      <div className="pol">
        <section>
          <h3>Where we deliver</h3>
          <p>We deliver to addresses across India.</p>
        </section>

        <section>
          <h3>Delivery time</h3>
          <p>
            Orders usually reach you within {DELIVERY_TIME} after we confirm them.
            We confirm every order by calling the mobile number you give at
            checkout, so please keep your phone reachable.
          </p>
        </section>

        <section>
          <h3>Delivery charge</h3>
          <p>
            The delivery charge is shown at checkout, before you place your order.
          </p>
        </section>

        <section>
          <h3>Payment</h3>
          <p>
            You can pay online with UPI, cards or netbanking, or choose cash on
            delivery. Online payments are handled by Razorpay. For cash on
            delivery, please keep the exact amount ready.
          </p>
        </section>

        <section>
          <h3>If your order is late</h3>
          <p>
            If your order has not arrived after {DELIVERY_TIME} from confirmation,
            please contact us and we will check it for you.
          </p>
          <ContactLine />
        </section>
      </div>
    </main>
  );
}

export default Shipping;