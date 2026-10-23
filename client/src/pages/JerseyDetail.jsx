import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
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

function JerseyDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const trackRef = useRef(null);

  const [jersey, setJersey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const loadJersey = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/jerseys/${id}`);
        setJersey(res.data);
        setError("");
      } catch (err) {
        const status = err.response?.status;
        setError(
          status === 400 || status === 404
            ? "This jersey was not found."
            : "Could not load this jersey. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadJersey();
  }, [id]);

  if (loading) {
    return (
      <main>
        <p className="message">Loading jersey...</p>
      </main>
    );
  }

  if (error || !jersey) {
    return (
      <main>
        <p className="message">{error}</p>
        <p className="message">
          <Link to="/shop" className="link">
            Back to shop
          </Link>
        </p>
      </main>
    );
  }

  const images = (jersey.images || []).filter(Boolean);
  const soldOut = jersey.sizes.every((s) => s.stock === 0);
  const hasSale = jersey.salePrice && jersey.salePrice < jersey.price;
  const discount = hasSale
    ? Math.round(((jersey.price - jersey.salePrice) / jersey.price) * 100)
    : 0;

  // scroll the big photo row to one photo
  const goTo = (index) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  // when the customer swipes or scrolls, work out which photo is showing
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

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
    <main>
      <Link to="/shop" className="link pd-back">
        Back to shop
      </Link>

      <div className="pd">
        <div className="pd-gallery">
          <div className="pd-viewer">
            {images.length > 0 ? (
              <div
                className="pd-track"
                ref={trackRef}
                onScroll={handleScroll}
                tabIndex={0}
                role="region"
                aria-label="Jersey photos"
              >
                {images.map((src, i) => (
                  <div className="pd-slide" key={`${src}-${i}`}>
                    <img
                      src={src}
                      alt={`${jersey.name}, photo ${i + 1} of ${images.length}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="pd-track">
                <div className="pd-slide">
                  <div className="placeholder" aria-hidden="true">
                    9
                  </div>
                </div>
              </div>
            )}

            {hasSale && !soldOut && <span className="badge">{discount}% off</span>}
            {soldOut && <span className="badge sold-out">Sold out</span>}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="pd-arrow prev"
                  aria-label="Previous photo"
                  onClick={() => goTo(active - 1)}
                  disabled={active === 0}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="pd-arrow next"
                  aria-label="Next photo"
                  onClick={() => goTo(active + 1)}
                  disabled={active === images.length - 1}
                >
                  ›
                </button>
                <span className="pd-counter">
                  {active + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="pd-thumbs">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  className={`pd-thumb${active === i ? " active" : ""}`}
                  aria-label={`Show photo ${i + 1}`}
                  onClick={() => goTo(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          <span className="version-tag">{versionLabels[jersey.version]}</span>
          <h2>{jersey.name}</h2>
          <p className="pd-meta">
            {jersey.team}, {jersey.season}
          </p>

          <p className="pd-price">
            {hasSale ? (
              <>
                <span className="price-sale">₹{jersey.salePrice}</span>
                <span className="price-old">₹{jersey.price}</span>
              </>
            ) : (
              <span className="price-sale">₹{jersey.price}</span>
            )}
          </p>

          <p className="pd-label">Size</p>
          <div className="sizes pd-sizes" role="group" aria-label="Choose a size">
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

          <p className="pd-note">Pay online or cash on delivery.</p>

          {jersey.description && <p className="pd-desc">{jersey.description}</p>}
        </div>
      </div>
    </main>
  );
}

export default JerseyDetail;