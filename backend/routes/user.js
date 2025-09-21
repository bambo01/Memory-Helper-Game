const express = require('express');
const router = express.Router();
const User = require('../models/user');

// POST /api/users/upsert
router.post('/upsert', async (req, res) => {
  const { address, chainId } = req.body;
  if (!address || !chainId) return res.status(400).json({ error: 'Missing fields' });

  try {
    let user = await User.findOne({ address });

    if (!user) {
      const lastUser = await User.findOne({}).sort({ memoryPackId: -1 });
      const memoryPackId = lastUser ? lastUser.memoryPackId + 1 : 1;

      user = await User.create({
        address,
        chainId,
        memoryPackId,
        flashcards: [],
      });
    } else {
      user.chainId = chainId;
      await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
