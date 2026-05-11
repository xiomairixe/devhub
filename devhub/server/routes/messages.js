const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Message = require('../models/Message');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

// ─── Helper: decode any valid token ──────────────────────────────────────────
function decodeToken(req) {
  try {
    const h = req.header('Authorization');
    if (!h) return null;
    return jwt.verify(h.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch { return null; }
}

// ─── GET project thread messages ─────────────────────────────────────────────
// Used by both admin and client
router.get('/project/:projectId', async (req, res) => {
  const decoded = decodeToken(req);
  if (!decoded) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
      .sort({ createdAt: 1 });

    // Mark as read for whoever is fetching
    if (decoded.role === 'admin') {
      await Message.updateMany(
        { projectId: req.params.projectId, readByAdmin: false },
        { readByAdmin: true }
      );
    } else {
      await Message.updateMany(
        { projectId: req.params.projectId, readByClient: false },
        { readByClient: true }
      );
    }

    res.json(messages);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET direct messages between admin and a specific client ─────────────────
router.get('/direct/:clientUserId', async (req, res) => {
  const decoded = decodeToken(req);
  if (!decoded) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const admin = await User.findOne({ role: 'admin' });
    const messages = await Message.find({
      projectId:    null,
      clientUserId: req.params.clientUserId,
      adminUserId:  admin._id
    }).sort({ createdAt: 1 });

    // Mark as read
    if (decoded.role === 'admin') {
      await Message.updateMany(
        { projectId: null, clientUserId: req.params.clientUserId, readByAdmin: false },
        { readByAdmin: true }
      );
    } else {
      await Message.updateMany(
        { projectId: null, clientUserId: decoded.id, readByClient: false },
        { readByClient: true }
      );
    }

    res.json(messages);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET unread counts (admin) ────────────────────────────────────────────────
router.get('/unread', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ readByAdmin: false });
    res.json({ count });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET unread count for client ─────────────────────────────────────────────
router.get('/unread/mine', async (req, res) => {
  const decoded = decodeToken(req);
  if (!decoded || decoded.role !== 'client')
    return res.status(401).json({ message: 'Unauthorized' });
  try {
    const count = await Message.countDocuments({
      clientUserId:  decoded.id,
      readByClient:  false,
      senderRole:    'admin'   // only count messages FROM admin
    });
    res.json({ count });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST send a message (admin or client) ────────────────────────────────────
// Body: { body, projectId? (null for direct), clientUserId (required for direct) }
router.post('/', async (req, res) => {
  const decoded = decodeToken(req);
  if (!decoded) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const { body, projectId, clientUserId } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

    const admin = await User.findOne({ role: 'admin' });

    // Determine clientUserId and adminUserId
    let resolvedClientUserId = clientUserId;
    const resolvedAdminUserId = admin._id;

    // If sender is client, clientUserId is themselves
    if (decoded.role === 'client') {
      resolvedClientUserId = decoded.id;
    }

    if (!resolvedClientUserId)
      return res.status(400).json({ message: 'clientUserId is required' });

    const msg = await Message.create({
      projectId:    projectId || null,
      clientUserId: resolvedClientUserId,
      adminUserId:  resolvedAdminUserId,
      senderId:     decoded.id,
      senderRole:   decoded.role,
      body:         body.trim(),
      readByAdmin:  decoded.role === 'admin',   // instantly read if sender is admin
      readByClient: decoded.role === 'client',  // instantly read if sender is client
    });

    // Emit via Socket.io (attached to app in server.js)
    const io = req.app.get('io');
    if (io) {
      // Emit to project room or direct room
      const room = projectId ? `project:${projectId}` : `direct:${resolvedClientUserId}`;
      io.to(room).emit('new_message', msg);
    }

    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;