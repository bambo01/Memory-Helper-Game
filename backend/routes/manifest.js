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

    // 2️⃣ Respond with CID only (no database save)
    res.status(201).json({ message: "Manifest pinned to IPFS", cid });

  } catch (err) {
    console.error("❌ Error pinning manifest:", err);

    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

router.post("/manifest", async (req, res) => {
  try {
    const { packTitle, packTokenId, score, total, completedAt } = req.body;

    if (!packTitle || packTokenId === undefined) {
      return res.status(400).json({ error: "packTitle and packTokenId are required" });
    }

    const metadata = {
      name: `Memory Badge – ${packTitle} #${packTokenId}`,
      description: `Completion badge for ${packTitle}. Score ${score}/${total}.`,
      image: "ipfs://<cid-of-your-badge-icon>", // optional but nice to have
      attributes: [
        { trait_type: "Pack TokenId", value: String(packTokenId) },
        { trait_type: "Score", value: score },
        { trait_type: "Total", value: total },
        { trait_type: "Completed At", value: completedAt },
      ],
    };

    // upload to Pinata
    const pinataResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      metadata,
      {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    const cid = pinataResponse.data.IpfsHash;
    const uri = `ipfs://${cid}`;

    res.status(201).json({ message: "Badge manifest pinned to IPFS", uri });
  } catch (err) {
    console.error("❌ Error pinning badge manifest:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});


module.exports = router;
