// backend/routes/activityRoutes.js
const express = require('express');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Récupérer le journal d'activité (Section 7 - Audit Trail)
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const activities = await Activity.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
