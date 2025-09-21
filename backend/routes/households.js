const express = require("express");
const router = express.Router();
const Household = require("../models/household");

// POST /api/households
router.post("/", async (req, res) => {
  try {
    const { tokenId, contract, cid, title, cards, owner } = req.body;

    if (
      !tokenId ||
      !contract ||
      !cid ||
      !title ||
      !owner ||
      !Array.isArray(cards) ||
      cards.length === 0
    ) {
      return res.status(400).json({ error: "Missing or empty fields" });
    }

    const household = new Household({
      tokenId,
      contract,
      title, 
      cards,
      cid,
      owner
    });

    await household.save();

    res.status(201).json(household);
  } catch (err) {
  console.error("households error", err);
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validation failed", details: err.errors });
  }
  res.status(500).json({ error: "Failed to save household" });
}
});

module.exports = router;
