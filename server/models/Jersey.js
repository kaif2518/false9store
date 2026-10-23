const mongoose = require("mongoose");
const TEAMS = require("../config/teams");

const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true },
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const jerseySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    team: { type: String, enum: TEAMS, required: true },
    season: { type: String, required: true },
    version: {
      type: String,
      enum: ["fan", "player", "retro", "kids" , "embroidered", "printed"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    sizes: [sizeSchema],
    images: [String],
    description: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Jersey", jerseySchema);