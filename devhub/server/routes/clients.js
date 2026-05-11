const express  = require('express');
const router   = express.Router();
const Client   = require('../models/Client');
const Project  = require('../models/Project');
const User     = require('../models/User');
const auth     = require('../middleware/auth');

// GET all clients
router.get('/', auth, async (req, res) => {
  try {
    const clients = await Client.find({ user: req.user.id }).sort({ createdAt: -1 });
    const withCounts = await Promise.all(clients.map(async (c) => {
      const count = await Project.countDocuments({ client: c._id });
      return { ...c.toObject(), projectCount: count };
    }));
    res.json(withCounts);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single client
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, user: req.user.id });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Find the User account linked to this client by email
    const userAccount = await User.findOne({ email: client.email, role: 'client' });

    const projects = await Project.find({ client: client._id });

    res.json({
      ...client.toObject(),
      projects,
      userId: userAccount?._id?.toString() || null  // always a string or null, never undefined
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create client
router.post('/', auth, async (req, res) => {
  try {
    const client = new Client({ ...req.body, user: req.user.id });
    await client.save();
    res.json(client);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update client
router.put('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    res.json(client);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE client
router.delete('/:id', auth, async (req, res) => {
  try {
    await Client.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Client removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;