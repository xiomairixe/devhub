const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const Inquiry  = require('../models/Inquiry');
const Project  = require('../models/Project');
const Client   = require('../models/Client');
const User     = require('../models/User');
const auth     = require('../middleware/auth');

// ─── Helper: safely decode a client token ────────────────────────────────────
function decodeClient(req) {
  try {
    const header = req.header('Authorization');
    if (!header) return null;
    const decoded = jwt.verify(header.replace('Bearer ', ''), process.env.JWT_SECRET);
    return decoded.role === 'client' ? decoded : null;
  } catch { return null; }
}

// ─── GET all inquiries (admin) ────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user.id };
    if (status && status !== 'All') filter.status = status;
    const inquiries = await Inquiry.find(filter)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET client's own inquiries ───────────────────────────────────────────────
router.get('/mine', async (req, res) => {
  const decoded = decodeClient(req);
  if (!decoded) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const inquiries = await Inquiry.find({ submittedBy: decoded.id })
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST submit inquiry (public + logged-in clients) ────────────────────────
router.post('/', async (req, res) => {
  try {
    const admin   = await User.findOne({ role: 'admin' });
    const decoded = decodeClient(req);

    const inquiry = new Inquiry({
      ...req.body,
      user:        admin?._id,
      submittedBy: decoded?.id || null
    });
    await inquiry.save();
    res.json({ message: 'Inquiry submitted successfully', inquiry });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT update inquiry status (admin) ───────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(inquiry);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST convert inquiry → project (admin) ──────────────────────────────────
router.post('/:id/convert', auth, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('submittedBy', 'name email');
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    if (inquiry.status === 'Converted')
      return res.status(400).json({ message: 'Already converted' });

    // 1. Find or create a Client record matched by email under this admin
    let client = await Client.findOne({ email: inquiry.email, user: req.user.id });
    if (!client) {
      client = await Client.create({
        name:  inquiry.name,
        email: inquiry.email,
        user:  req.user.id
      });
    }

    // 2. Create the project — clientUserId links it to the portal user account
    const project = await Project.create({
      title:        `${inquiry.projectType} – ${inquiry.name}`,
      description:  inquiry.description,
      client:       client._id,
      clientUserId: inquiry.submittedBy?._id || null,
      budgetRange:  inquiry.budgetRange  || '',
      deadline:     inquiry.deadline     || null,
      status:       'Pending',
      progress:     0,
      user:         req.user.id
    });

    // 3. Mark inquiry as Converted and store the resulting projectId
    await Inquiry.findByIdAndUpdate(req.params.id, {
      status:    'Converted',
      projectId: project._id
    });

    await project.populate('client', 'name company');
    res.json({ message: 'Project created successfully', project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE inquiry (admin) ───────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inquiry removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;