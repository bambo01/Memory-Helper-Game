const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  relation: {
    type: String,
    default: "",
  },
  hint: {
    type: String,
    default: "",
  },
  imageUrl: {
    type: String,
    required: true,
  }
});

const householdSchema = new mongoose.Schema({
  tokenId: { type: Number, required: true },
  contract: { type: String, required: true },
   title: {
    type: String,
    required: true,
  },
  cards: [flashcardSchema], // An array of flashcard objects
  cid: { type: String, required: true },
  owner: {type: String, required: true},
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Household", householdSchema);
