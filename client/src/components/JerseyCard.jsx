import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../product.css";

const versionLabels = {
  fan: "Fan version",
  player: "Player version",
  retro: "Retro",
  kids: "Kids",
  embroidered: "Embroidered version",
  printed: "Printed version",
};

function JerseyCard({ jersey }) {
  const { addItem } = useCart();
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);

  const soldOut = jersey.sizes.every((s) => s.stock === 0);
  const hasSale = jersey.salePrice && jersey.salePrice < jersey.price;
  const discount = hasSale
    ? Math.round(((jersey.price - jersey.salePrice) / jersey.price) * 100)
    : 0;
  const link = `/jersey/${jersey._id}`;

  const handleAdd = () => {
    const chosen = jersey.sizes.find((s) => s.size === size);
    if (!chosen) return;

    addItem(jersey, size, chosen.stock);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  let buttonLabel = "Add to cart";
  if (soldOut) buttonLabel = "Sold out";
  else if (!size) buttonLabel = "Select a size";
  else if (added) buttonLabel = "Added ✓";

  return (
    <article className={`card${soldOut ? " card-sold-out" : ""}`}>
      <Link to={link} className="card-image-link" aria-label={`View ${jersey.name}`}>
        <div className="card-image">
          {jersey.images[0] ? (
            <img src={jersey.images[0]} alt={jersey.name} />
          ) : (
            <div className="placeholder" aria-hidden="true">
              9
            </div>
          )}
          {hasSale && !soldOut && <span className="badge">{discount}% off</span>}
          {soldOut && <span className="badge sold-out">Sold out</span>}
          {jersey.images.length > 1 && (
            <span className="photo-count">{jersey.images.length} photos</span>
          )}
        </div>
      </Link>

      <div className="card-body">
        <span className="version-tag">{versionLabels[jersey.version]}</span>
        <h3 className="card-name">
          <Link to={link}>{jersey.name}</Link>
        </h3>
        <p className="card-team">
          {jersey.team}, {jersey.season}
        </p>

        <p className="card-price">
          {hasSale ? (
            <>
              <span className="price-sale">₹{jersey.salePrice}</span>
              <span className="price-old">₹{jersey.price}</span>
            </>
          ) : (
            <span className="price-sale">₹{jersey.price}</span>
          )}
        </p>

        <div className="sizes" role="group" aria-label="Choose a size">
          {jersey.sizes.map((s) => (
            <button
              key={s.size}
              type="button"
              className={`chip${size === s.size ? " active" : ""}`}
              disabled={s.stock === 0}
              aria-pressed={size === s.size}
              onClick={() => setSize(s.size)}
            >
              {s.size}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={handleAdd}
          disabled={soldOut || !size}
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}

export default JerseyCard;