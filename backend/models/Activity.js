// backend/models/Activity.js
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'TASK_CREATED',
      'TASK_UPDATED',
      'TASK_STATUS_CHANGED',
      'TASK_DELETED',
      'SUBTASK_TOGGLED',
      'ATTACHMENT_ADDED',
      'COMMENT_ADDED',
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'PROJECT_DELETED',
      'ROLE_UPDATED'
    ]
  },
  targetType: {
    type: String,
    enum: ['Task', 'Project', 'User'],
    required: true
  },
  targetTitle: {
    type: String,
    default: ''
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
