const express = require("express");
const mongoose = require("mongoose");
const Jersey = require("../models/Jersey");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE a jersey (admin only)
router.post("/", protect, admin, async (req, res) => {
  try {
    const { price, salePrice } = req.body;

    if (salePrice !== undefined && salePrice >= price) {
      return res
        .status(400)
        .json({ message: "salePrice must be lower than price" });
    }

    const jersey = await Jersey.create(req.body);
    res.status(201).json(jersey);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// LIST jerseys with filters (public)
router.get("/", async (req, res) => {
  try {
    const {
      team,
      season,
      version,
      size,
      inStock,
      featured,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};
    const stockConditions = [];

    if (team) filter.team = team;
    if (season) filter.season = season;
    if (version) filter.version = version;

    if (size) {
      stockConditions.push({
        sizes: { $elemMatch: { size, stock: { $gt: 0 } } },
      });
    }

    if (featured === "true") {
      filter.isFeatured = true;
      stockConditions.push({ sizes: { $elemMatch: { stock: { $gt: 0 } } } });
    }

    if (inStock === "true") {
      stockConditions.push({ sizes: { $elemMatch: { stock: { $gt: 0 } } } });
    }

    if (stockConditions.length) filter.$and = stockConditions;

    const sortOptions = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    };

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 50);

    const total = await Jersey.countDocuments(filter);
    const jerseys = await Jersey.find(filter)
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    res.json({
      jerseys,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET filter options: teams and seasons that exist (public)
router.get("/filters", async (req, res) => {
  try {
    const teams = await Jersey.distinct("team");
    const seasons = await Jersey.distinct("season");

    res.json({
      teams: teams.sort(),
      seasons: seasons.sort().reverse(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET one jersey (public)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid jersey id" });
    }

    const jersey = await Jersey.findById(req.params.id);
    if (!jersey) {
      return res.status(404).json({ message: "Jersey not found" });
    }

    res.json(jersey);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE a jersey (admin only)
router.put("/:id", protect, admin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid jersey id" });
    }

    const { price, salePrice } = req.body;
    if (price !== undefined && salePrice !== undefined && salePrice >= price) {
      return res
        .status(400)
        .json({ message: "salePrice must be lower than price" });
    }

    const jersey = await Jersey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!jersey) {
      return res.status(404).json({ message: "Jersey not found" });
    }

    res.json(jersey);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a jersey (admin only)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid jersey id" });
    }

    const jersey = await Jersey.findByIdAndDelete(req.params.id);
    if (!jersey) {
      return res.status(404).json({ message: "Jersey not found" });
    }

    res.json({ message: "Jersey deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;