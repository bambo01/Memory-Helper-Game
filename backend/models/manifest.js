const mongoose = require('mongoose');

// Schema for an individual flashcard within the manifest
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

// Main manifest schema
const manifestSchema = new mongoose.Schema({
  cid: {
    type: String,
    required: true,
    unique: true, // CID should be unique for each manifest
  },
  title: {
    type: String,
    required: true,
  },
  cards: [flashcardSchema], // An array of flashcard objects
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Create and export the Mongoose model
const Manifest = mongoose.model('manifest', manifestSchema);

module.exports = Manifest;  