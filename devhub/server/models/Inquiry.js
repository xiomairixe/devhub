const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  projectType: { type: String },
  budgetRange: { type: String },
  deadline:    { type: Date },
  description: { type: String },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Negotiating', 'Converted', 'Closed Won', 'Closed Lost'],
    default: 'New'
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inquiry', InquirySchema);