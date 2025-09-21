const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const flashcardsRoutes = require("./routes/flashcards");
const manifestRoutes = require("./routes/manifest");
const householdsRoutes = require("./routes/households");
const usersRoutes = require("./routes/user"); // make sure file is `users.js`

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use("/api/flashcards", flashcardsRoutes);
app.use("/api/manifest", manifestRoutes);
app.use("/api/households", householdsRoutes);
app.use("/api/users", usersRoutes);

// Serve uploads folder for images
app.use("/uploads", express.static("uploads"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(console.error);

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
