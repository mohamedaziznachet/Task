const mongoose = require('mongoose');

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
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);