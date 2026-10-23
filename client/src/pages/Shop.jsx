import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import JerseyCard from "../components/JerseyCard";
import FilterBar from "../components/FilterBar";

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [options, setOptions] = useState({ teams: [], seasons: [] });
  const [jerseys, setJerseys] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // the filters live in the address bar, for example /shop?version=fan&size=M
  const filters = {
    team: searchParams.get("team") || "",
    season: searchParams.get("season") || "",
    version: searchParams.get("version") || "",
    size: searchParams.get("size") || "",
    inStock: searchParams.get("inStock") === "true",
    sort: searchParams.get("sort") || "newest",
  };

  const query = searchParams.toString();

  const updateFilters = (next) => {
    const params = {};
    Object.entries(next).forEach(([key, value]) => {
      if (!value) return;
      if (key === "sort" && value === "newest") return;
      params[key] = String(value);
    });
    setSearchParams(params);
  };

  // runs once: the team and season lists
  useEffect(() => {
    api
      .get("/jerseys/filters")
      .then((res) => setOptions(res.data))
      .catch(() => {
        // the shop still works without the dropdown lists
      });
  }, []);

  // runs every time the address bar filters change
  useEffect(() => {
    const loadJerseys = async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries(new URLSearchParams(query));
        const res = await api.get("/jerseys", {
          params: { ...params, limit: 48 },
        });
        setJerseys(res.data.jerseys);
        setTotal(res.data.total);
        setError("");
      } catch {
        setError("Could not load jerseys. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadJerseys();
  }, [query]);

  return (
    <main className="shop">
      <h2>Shop</h2>

      <div className="shop-layout">
        <FilterBar
          filters={filters}
          options={options}
          onChange={updateFilters}
          onClear={() => setSearchParams({})}
        />

        <section>
          <div className="shop-top">
            <p className="shop-count">
              {loading ? "Loading..." : `${total} ${total === 1 ? "jersey" : "jerseys"}`}
            </p>
            <label className="sort">
              Sort by
              <select
                value={filters.sort}
                onChange={(e) => updateFilters({ ...filters, sort: e.target.value })}
              >
                <option value="newest">Newest first</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </label>
          </div>

          {error && <p className="message">{error}</p>}

          {!loading && !error && jerseys.length === 0 && (
            <p className="message">No jerseys match these filters.</p>
          )}

          {!error && jerseys.length > 0 && (
            <div className="grid">
              {jerseys.map((jersey) => (
                <JerseyCard key={jersey._id} jersey={jersey} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Shop;