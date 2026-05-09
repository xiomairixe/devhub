const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Client  = require('../models/Client');
const auth    = require('../middleware/auth');

// ─── Register (client only) ───────────────────────────────────────────────────
// Creates a User record AND a matching Client record so the client
// appears on the admin Clients page immediately after signing up.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashed, role: 'client' });
    await user.save();

    // Find the admin to assign ownership of the Client record
    const admin = await User.findOne({ role: 'admin' });

    // Create a Client record linked to this User so they show on the Clients page
    const existingClient = await Client.findOne({ email });
    if (!existingClient && admin) {
      await Client.create({
        name,
        email,
        user: admin._id   // scoped to the admin
      });
    } else if (existingClient) {
      // If admin already created a Client record for this email, just stamp the userId
      // (no userId field on Client model, but the link is done via email match in /clients/:id)
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Login (admin + client) ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Get current user ─────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;