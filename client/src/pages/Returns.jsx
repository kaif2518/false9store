import ContactLine from "../components/ContactLine";
import "../policy.css";

// Change these lines when your rules change.
const WINDOW_DAYS = 7;

// CONFIRM before launch: who pays for the return parcel.
const RETURN_SHIPPING_TEXT =
  "If we sent the wrong jersey, or it arrived damaged, we pay the return shipping. For a size exchange, the return shipping is paid by the customer.";

// CONFIRM before launch: how and when refunds are paid.
const REFUND_TEXT =
  "If a refund is due, it goes back the way you paid. Online payments return to the same account, which usually takes 5 to 7 working days after we receive and check the jersey. For cash on delivery orders, we refund by bank transfer or UPI.";

function Returns() {
  return (
    <main>
      <h2>Returns and exchange</h2>

      <div className="pol">
        <section>
          <h3>Time to ask</h3>
          <p>
            You can ask for an exchange or a return within {WINDOW_DAYS} days after
            your jersey is delivered.
          </p>
        </section>

        <section>
          <h3>When we accept</h3>
          <ul>
            <li>
              The size does not fit. We exchange it for another size, if that size
              is in stock.
            </li>
            <li>
              You received a different jersey from the one you ordered (team,
              version or size).
            </li>
            <li>The jersey is damaged or has a manufacturing defect.</li>
          </ul>
          <p>
            The jersey must be unused and unwashed, with its tags and original
            packaging.
          </p>
        </section>

        <section>
          <h3>When we cannot accept</h3>
          <ul>
            <li>The jersey has been worn, washed or altered.</li>
            <li>The tags or packaging are missing.</li>
            <li>The request comes after the {WINDOW_DAYS} days.</li>
          </ul>
        </section>

        <section>
          <h3>How to ask</h3>
          <p>
            Contact us within {WINDOW_DAYS} days of delivery with your order
            number. For a wrong or damaged jersey, please also send clear photos.
            We will reply with the next steps.
          </p>
          <ContactLine />
        </section>

        <section>
          <h3>Return shipping</h3>
          <p>{RETURN_SHIPPING_TEXT}</p>
        </section>

        <section>
          <h3>Refunds</h3>
          <p>{REFUND_TEXT}</p>
        </section>

        <section>
          <h3>Cancelling an order</h3>
          <p>
            You can cancel an order before it ships, by contacting us with your
            order number. After it ships, the rules above apply.
          </p>
        </section>
      </div>
    </main>
  );
}

export default Returns;