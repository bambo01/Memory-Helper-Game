import express from "express";
import { NFTStorage, File } from "nft.storage";

const router = express.Router();

const client = new NFTStorage({ token: process.env.NFT_STORAGE_KEY });

router.post("/", async (req, res) => {
  try {
    const manifest = req.body; // { title, cards }

    // Convert manifest JSON to a File object
    const files = [
      new File(
        [JSON.stringify(manifest, null, 2)],
        "manifest.json",
        { type: "application/json" }
      )
    ];

    // Upload to NFT.Storage
    const cid = await client.storeDirectory(files); // returns CID of the directory

    res.json({ cid });
  } catch (err) {
    console.error("Error uploading manifest:", err);
    res.status(500).json({ error: "Failed to upload manifest" });
  }
});

export default router;
