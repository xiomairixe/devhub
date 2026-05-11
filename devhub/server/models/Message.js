const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  // If projectId is set → project thread. If null → direct message.
  projectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },

  // For direct messages: who is the conversation between
  clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminUserId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Who sent this specific message
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['admin', 'client'], required: true },

  body: { type: String, required: true },

  readByAdmin:  { type: Boolean, default: false },
  readByClient: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);