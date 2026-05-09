const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt        = require('jsonwebtoken');
const Project    = require('../models/Project');
const auth       = require('../middleware/auth');

// ─── Cloudinary config ────────────────────────────────────────────────────────
// Validate keys at startup so you get a clear error immediately
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ CLOUDINARY env vars missing:', {
    CLOUDINARY_CLOUD_NAME: CLOUDINARY_CLOUD_NAME || 'MISSING',
    CLOUDINARY_API_KEY:    CLOUDINARY_API_KEY    ? 'SET' : 'MISSING',
    CLOUDINARY_API_SECRET: CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
  });
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key:    CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        'devhub/files',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'mp4'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── Helper: decode any valid token ──────────────────────────────────────────
function decodeToken(req) {
  try {
    const header = req.header('Authorization');
    if (!header) return null;
    return jwt.verify(header.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch { return null; }
}

// ─── 1. GET client's own projects ─────────────────────────────────────────────
router.get('/my-projects', async (req, res) => {
  const decoded = decodeToken(req);
  if (!decoded || decoded.role !== 'client')
    return res.status(401).json({ message: 'Unauthorized' });
  try {
    const projects = await Project.find({ clientUserId: decoded.id })
      .populate('client', 'name company')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 2. GET single project for client portal ──────────────────────────────────
router.get('/portal/:id', async (req, res) => {
  const decoded = decodeToken(req);
  if (!decoded || decoded.role !== 'client')
    return res.status(401).json({ message: 'Unauthorized' });
  try {
    const project = await Project.findOne({
      _id:          req.params.id,
      clientUserId: decoded.id,
    }).populate('client', 'name company');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 3. GET all projects (admin) ──────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user.id };
    if (status && status !== 'All') filter.status = status;
    const projects = await Project.find(filter)
      .populate('client', 'name company')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 4. GET single project (admin) ───────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id:  req.params.id,
      user: req.user.id,
    }).populate('client', 'name company email phone');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 5. POST create project (admin) ──────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const project = new Project({ ...req.body, user: req.user.id });
    await project.save();
    await project.populate('client', 'name company');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── 6. PUT update project (admin) ───────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    ).populate('client', 'name company');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 7. POST upload delivery file (admin) ────────────────────────────────────
router.post('/:id/upload', auth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary upload error:', err);
      return res.status(500).json({
        message: err.message || 'Upload failed',
        detail:  err.http_code ? `Cloudinary error ${err.http_code}` : undefined,
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file received' });

    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.deliveryFiles.push({
      name:     req.file.originalname,
      url:      req.file.path,
      publicId: req.file.filename,
    });
    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Upload route error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ─── 8. DELETE delivery file (admin) ─────────────────────────────────────────
router.delete('/:id/files/:publicId', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const publicId = decodeURIComponent(req.params.publicId);

    // Remove from Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });

    // Remove from project
    project.deliveryFiles = project.deliveryFiles.filter(f => f.publicId !== publicId);
    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ─── 9. DELETE project (admin) ────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Project removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;