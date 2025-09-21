const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  name: String,
  photoUrl: String,
  category: String,
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  chainId: { type: Number, required: true },
  memoryPackId: { type: Number, default: null },
  flashcards: [flashcardSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
