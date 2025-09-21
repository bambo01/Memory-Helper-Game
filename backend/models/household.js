const mongoose = require("mongoose");

const householdSchema = new mongoose.Schema({
  tokenId: { type: Number, required: true },
  contract: { type: String, required: true },
  cid: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Household", householdSchema);
