import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Hero from "../components/Hero";
import JerseyCard from "../components/JerseyCard";

const versions = [
  { value: "fan", label: "Fan version" },
  { value: "player", label: "Player version" },
  { value: "retro", label: "Retro" },
  { value: "kids", label: "Kids" },
  { value: "embroidered", label: "Embroidered"},  
  { value: "printed", label: "Printed"}, 
];

function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await api.get("/jerseys", {
          params: { featured: true, limit: 4 },
        });
        setFeatured(res.data.jerseys);
      } catch {
        setError("Could not load jerseys. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadFeatured();
  }, []);

  return (
    <>
      <Hero />
      <main>
        {loading && <p className="message">Loading jerseys...</p>}
        {error && <p className="message">{error}</p>}

        {featured.length > 0 && (
          <section>
            <div className="section-head">
              <h2>Top products of this week</h2>
              <Link to="/shop" className="link">
                View all jerseys
              </Link>
            </div>
            <div className="grid">
              {featured.map((jersey) => (
                <JerseyCard key={jersey._id} jersey={jersey} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2>Shop by version</h2>
          <div className="version-links">
            {versions.map((v) => (
              <Link key={v.value} to={`/shop?version=${v.value}`}>
                {v.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;