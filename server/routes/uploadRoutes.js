const express = require("express");
const crypto = require("crypto");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// All jersey photos go into this Cloudinary folder
const FOLDER = "false9/jerseys";

// The browser asks for permission to upload one photo. Only an admin gets it.
router.get("/signature", protect, admin, (req, res) => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res
      .status(500)
      .json({ message: "Cloudinary keys are missing in server/.env" });
  }

  const timestamp = Math.round(Date.now() / 1000);

  // Cloudinary signs the parameters in alphabetical order, followed by the secret
  const toSign = `folder=${FOLDER}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(toSign + CLOUDINARY_API_SECRET)
    .digest("hex");

  // the secret itself is never sent, only the signature made from it
  res.json({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    timestamp,
    folder: FOLDER,
    signature,
  });
});

module.exports = router;