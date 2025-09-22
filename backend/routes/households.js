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


router.get("/byToken/:tokenId", async (req, res) => {
  const { tokenId } = req.params;

  try {
    // Find the household by tokenId
    const household = await Household.findOne({ tokenId: Number(tokenId) });

    if (!household) {
      return res.status(404).json({ error: "Household not found" });
    }

    // Map cards to the frontend-friendly structure
    const cards = (household.cards || []).map((c) => ({
      id: c.id,
      name: c.name,
      relation: c.relation,
      hint: c.hint,
      image: c.imageUrl, // use imageUrl as the frontend expects `image`
    }));

    res.json({
      tokenId: household.tokenId,
      contract: household.contract,
      title: household.title,
      cid: household.cid,
      owner: household.owner,
      createdAt: household.createdAt,
      cards,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
