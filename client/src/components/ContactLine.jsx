import { STORE } from "../storeInfo";

// Shows the contact details that are filled in storeInfo.js, and nothing if none are
function ContactLine() {
  const parts = [STORE.email, STORE.phone].filter(Boolean);

  if (parts.length === 0) {
    return <p>Please contact us with your order number.</p>;
  }

  return (
    <p>
      Contact us at {parts.join(" or ")}
      {STORE.hours ? ` (${STORE.hours})` : ""}, and keep your order number ready.
    </p>
  );
}

export default ContactLine;