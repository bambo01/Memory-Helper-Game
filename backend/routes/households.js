const express = require("express");
const router = express.Router();
const Household = require("../models/household");

// POST /api/households
router.post("/", async (req, res) => {
  try {
    const { tokenId, contract, cid } = req.body;
    if (!tokenId || !contract || !cid) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const household = new Household({
      tokenId,
      contract,
      cid,
      createdAt: new Date()
    });
    await household.save();

    res.json(household);
  } catch (err) {
    console.error("households error", err);
    res.status(500).json({ error: "Failed to save household" });
  }
});

module.exports = router;
