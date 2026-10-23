import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import "../checkout.css";
import "../admin.css";
import { uploadImage } from "../api/cloudinaryUpload";

// Must match server/config/teams.js
const TEAMS = [
  "Barcelona",
  "Manchester City",
  "Manchester United",
  "PSG",
  "Liverpool",
  "Juventus",
  "Inter Milan",
  "AC Milan",
  "Bayern Munich",
  "Borussia Dortmund",
  "Chelsea",
  "Arsenal",
  "Real Madrid",
  "Atletico Madrid",
  "Real Betis",
];

const VERSIONS = ["fan", "player", "retro", "kids" , "embroidered", "printed"];
const SIZES = ["S", "M", "L", "XL", "XXL"];

const emptyStock = () => Object.fromEntries(SIZES.map((s) => [s, "0"]));

const emptyForm = () => ({
  name: "",
  team: TEAMS[0],
  season: "2026-27",
  version: "fan",
  price: "",
  salePrice: "",
  description: "",
  images: "",
  isFeatured: false,
});

export default function AdminJerseyForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [stock, setStock] = useState(emptyStock);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState(false);
  // edit mode: load the jersey and fill the form
  useEffect(() => {
    if (!isEdit) return;

    api
      .get(`/jerseys/${id}`)
      .then(({ data }) => {
        const jersey = data.jersey || data;

        setForm({
          name: jersey.name || "",
          team: jersey.team || TEAMS[0],
          season: jersey.season || "",
          version: jersey.version || "fan",
          price: String(jersey.price ?? ""),
          salePrice: jersey.salePrice ? String(jersey.salePrice) : "",
          description: jersey.description || "",
          images: (jersey.images || []).join("\n"),
          isFeatured: Boolean(jersey.isFeatured),
        });

        const next = emptyStock();
        (jersey.sizes || []).forEach((row) => {
          if (SIZES.includes(row.size)) next[row.size] = String(row.stock ?? 0);
        });
        setStock(next);
      })
      .catch((err) => {
        setLoadError(err.response?.data?.message || "Could not load this jersey.");
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleStock = (size, value) => {
    setStock({ ...stock, [size]: value });
  };

    // upload the chosen photos and add each link to the "Image links" box
  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setError("");
    setUploading(true);

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not an image.`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is larger than 10 MB.`);
        }

        const url = await uploadImage(file);

        // add the link as soon as it is ready, so earlier uploads are kept if a later one fails
        setForm((current) => ({
          ...current,
          images: [
            ...current.images.split("\n").map((line) => line.trim()).filter(Boolean),
            url,
          ].join("\n"),
        }));
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Could not upload the photos."
      );
    }

    setUploading(false);
  };
  const imageList = () =>
    form.images
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const validate = () => {
    if (!form.name.trim()) return "Please enter the jersey name.";
    if (!/^\d{4}-\d{2}$/.test(form.season.trim()))
      return "Season must look like 2026-27.";

    const price = Number(form.price);
    if (form.price === "" || !Number.isFinite(price) || price <= 0)
      return "Please enter a valid price.";

    if (form.salePrice !== "") {
      const sale = Number(form.salePrice);
      if (!Number.isFinite(sale) || sale <= 0)
        return "Please enter a valid sale price, or leave it empty.";
      if (sale >= price) return "Sale price must be lower than the price.";
    }

    for (const size of SIZES) {
      const n = Number(stock[size]);
      if (stock[size] === "" || !Number.isInteger(n) || n < 0)
        return `Stock for size ${size} must be a whole number, 0 or more.`;
    }

    for (const link of imageList()) {
      if (!/^(https?:\/\/|\/)/.test(link))
        return "Each image link must start with http, https or /.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const problem = validate();
    if (problem) {
      setError(problem);
      setDone("");
      return;
    }

    setError("");
    setDone("");
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      team: form.team,
      season: form.season.trim(),
      version: form.version,
      price: Number(form.price),
      sizes: SIZES.map((size) => ({ size, stock: Number(stock[size]) })),
      images: imageList(),
      description: form.description.trim(),
      isFeatured: form.isFeatured,
    };

    try {
      if (isEdit) {
        // null removes the sale price
        payload.salePrice = form.salePrice === "" ? null : Number(form.salePrice);
        await api.put(`/jerseys/${id}`, payload);
        navigate("/admin/jerseys", { replace: true });
        return;
      }

      if (form.salePrice !== "") payload.salePrice = Number(form.salePrice);
      await api.post("/jerseys", payload);
      setDone(`Added: ${payload.name}`);
      // keep team, season and version, so adding many jerseys is faster
      setForm({
        ...emptyForm(),
        team: form.team,
        season: form.season,
        version: form.version,
      });
      setStock(emptyStock());
      window.scrollTo(0, 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save the jersey. Please try again."
      );
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <main>
        <p className="message">Loading...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main>
        <h2>Edit jersey</h2>
        <p className="co-error">{loadError}</p>
        <p className="message">
          <Link to="/admin/jerseys" className="link">
            Back to jerseys
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h2>{isEdit ? "Edit jersey" : "Add jersey"}</h2>
      <p className="message">
        <Link to={isEdit ? "/admin/jerseys" : "/admin"} className="link">
          {isEdit ? "Back to jerseys" : "Back to admin"}
        </Link>
      </p>

      {done && <p className="ad-success">{done}</p>}

      <form className="co-form ad-form" onSubmit={handleSubmit} noValidate>
        <label className="co-field">
          <span>Name</span>
          <input name="name" value={form.name} onChange={handleChange} />
        </label>

        <div className="co-row">
          <label className="co-field">
            <span>Team</span>
            <select name="team" value={form.team} onChange={handleChange}>
              {TEAMS.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
          <label className="co-field">
            <span>Version</span>
            <select name="version" value={form.version} onChange={handleChange}>
              {VERSIONS.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="co-row">
          <label className="co-field">
            <span>Season (like 2026-27)</span>
            <input name="season" value={form.season} onChange={handleChange} />
          </label>
          <label className="co-field">
            <span>Price (₹)</span>
            <input
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
            />
          </label>
        </div>

        <label className="co-field">
          <span>Sale price (₹, optional, must be lower than the price)</span>
          <input
            name="salePrice"
            type="number"
            min="0"
            value={form.salePrice}
            onChange={handleChange}
          />
        </label>

        <h3 className="co-heading">Stock by size</h3>
        <div className="ad-sizes">
          {SIZES.map((size) => (
            <label className="ad-size" key={size}>
              <span>{size}</span>
              <input
                type="number"
                min="0"
                value={stock[size]}
                onChange={(e) => handleStock(size, e.target.value)}
              />
            </label>
          ))}
        </div>

        <label className="co-field">
          <span>Image links (one per line, optional for now)</span>
                  <div className="co-field">
          <span>Upload photos (the first photo is the main one)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotos}
            disabled={uploading}
          />
          {uploading && <span>Uploading, please wait...</span>}
        </div>
          <textarea name="images" value={form.images} onChange={handleChange} />
        </label>

        <label className="co-field">
          <span>Description (optional)</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </label>

        <label className="ad-check">
          <input
            type="checkbox"
            name="isFeatured"
            checked={form.isFeatured}
            onChange={handleChange}
          />
          Feature on the homepage (shown only while in stock)
        </label>

        {error && <p className="co-error">{error}</p>}

        <button className="co-submit" type="submit" disabled={submitting || uploading}>
          {submitting ? "Please wait..." : isEdit ? "Save changes" : "Add jersey"}
        </button>
      </form>
    </main>
  );
}