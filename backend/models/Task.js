const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  mimetype: { type: String, default: '' },
  size: { type: Number, default: 0 },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Non commencée', 'En cours', 'Terminée'],
    default: 'Non commencée'
  },
  priority: {
    type: String,
    enum: ['Faible', 'Moyenne', 'Haute'],
    default: 'Moyenne'
  },
  dueDate: { type: Date, required: true },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  subtasks: [subtaskSchema],
  attachments: [attachmentSchema],
  comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
