const express = require("express");
const axios = require("axios");
const Manifest = require("../models/manifest");
const router = express.Router();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

// Pin to IPFS and save to DB in one step
router.post("/", async (req, res) => {
  try {
    const { title, cards } = req.body;

    if (!title || !cards || !cards.length) {
      return res.status(400).json({ error: "Title and cards are required" });
    }

    // 1️⃣ Pin manifest to IPFS via Pinata
    const pinataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      { title, cards },
      {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    const cid = pinataResponse.data.IpfsHash;
    console.log("✅ Pinata CID:", cid);

    // 2️⃣ Save manifest to MongoDB
    const newManifest = new Manifest({ title, cards, cid });
    await newManifest.save();

    // 3️⃣ Respond with CID
    res.status(201).json({ message: "Manifest saved", cid });

  } catch (err) {
    console.error("❌ Error saving manifest:", err);

    if (err.name === "ValidationError") {
      const details = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: "Validation failed", details });
    }

    if (err.code === 11000) {
      return res.status(409).json({ error: "Duplicate CID", details: "Manifest already exists" });
    }

    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

module.exports = router;
