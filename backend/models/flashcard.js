const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema({
  id: String,          // keep track of frontend id
  name: String,
  relation: String,
  hint: String,
  imageUrl: String,    // will store /uploads/filename
}, { timestamps: true });

module.exports = mongoose.model("Flashcard", flashcardSchema);
