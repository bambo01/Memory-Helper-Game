const express = require("express");
const axios = require("axios");

const router = express.Router();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

router.post("/", async (req, res) => {
  try {
    const manifest = req.body;
    console.log("📤 Received manifest:", manifest);

    const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

    const response = await axios.post(url, manifest, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    console.log("✅ Pinata response:", response.data);

    res.json({ cid: response.data.IpfsHash });
  } catch (err) {
    console.error("❌ Error uploading manifest:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to upload manifest" });
  }
});


module.exports = router;
