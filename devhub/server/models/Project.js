const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  title:     String,
  dueDate:   Date,
  completed: { type: Boolean, default: false }
});

const ProjectSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client:       { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title:        { type: String, required: true },
  description:  { type: String },
  budget:       { type: Number },
  budgetRange:  { type: String },          // ← added: stores the range from inquiry
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Done', 'On Hold'],
    default: 'Pending'
  },
  progress:   { type: Number, default: 0, min: 0, max: 100 },
  startDate:  { type: Date },
  deadline:   { type: Date },
  milestones: [MilestoneSchema],
  deliveryFiles: [{
    name:     String,
    url:      String,
    publicId: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);