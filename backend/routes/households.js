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


// GET /api/households?owner=0x123...
router.get("/", async (req, res) => {
  try {
    const { owner } = req.query;

    if (!owner) {
      return res.status(400).json({ error: "Owner address is required" });
    }

    const households = await Household.find({ owner });

    res.json(households);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch households" });
  }
});

module.exports = router;
