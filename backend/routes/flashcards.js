const express = require("express");
const multer = require("multer");
const path = require("path");
const Flashcard = require("../models/flashcard");

const router = express.Router();

// configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/**
 * POST /api/flashcards/batchUpsert
 * Expects: meta (json) + image files
 */
router.post("/batchUpsert", upload.any(), async (req, res) => {
  try {
    console.log("Body meta:", req.body.meta);
    console.log("Files:", req.files);

    const meta = JSON.parse(req.body.meta);   // array of cards
    const files = req.files || [];

    const flashcards = meta.map((card, i) => {
      const file = files.find(f => f.fieldname === `image_${i}`);
      return {
        id: card.id,
        name: card.name,
        relation: card.relation,
        hint: card.hint,
        imageUrl: file ? `/uploads/${file.filename}` : null,
      };
    });

    const saved = await Flashcard.insertMany(flashcards);
    res.json(saved);
  } catch (err) {
    console.error("Flashcards error:", err);
    res.status(500).json({ error: "Failed to save flashcards" });
  }
});

module.exports = router;
