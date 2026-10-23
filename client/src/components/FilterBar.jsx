const versions = [
  { value: "fan", label: "Fan" },
  { value: "player", label: "Player" },
  { value: "retro", label: "Retro" },
  { value: "kids", label: "Kids"},
  { value: "embroidered", label: "Embroidered"},  
  { value: "printed", label: "Printed"},
];

const sizes = ["S", "M", "L", "XL", "XXL"];

function FilterBar({ filters, options, onChange, onClear }) {
  const set = (name, value) => onChange({ ...filters, [name]: value });
  const toggle = (name, value) =>
    set(name, filters[name] === value ? "" : value);

  return (
    <aside className="filters">
      <div className="filter-group">
        <h3>Availability</h3>
        <label className="check">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => set("inStock", e.target.checked)}
          />
          In stock only
        </label>
      </div>

      <div className="filter-group">
        <h3>Team</h3>
        <select value={filters.team} onChange={(e) => set("team", e.target.value)}>
          <option value="">All teams</option>
          {options.teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <h3>Season</h3>
        <select value={filters.season} onChange={(e) => set("season", e.target.value)}>
          <option value="">All seasons</option>
          {options.seasons.map((season) => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <h3>Version</h3>
        <div className="chips">
          {versions.map((v) => (
            <button
              key={v.value}
              type="button"
              className={`chip${filters.version === v.value ? " active" : ""}`}
              aria-pressed={filters.version === v.value}
              onClick={() => toggle("version", v.value)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h3>Size</h3>
        <div className="chips">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={`chip${filters.size === size ? " active" : ""}`}
              aria-pressed={filters.size === size}
              onClick={() => toggle("size", size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="filter-clear" onClick={onClear}>
        Clear filters
      </button>
    </aside>
  );
}

export default FilterBar;