const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, async (req, res) => {
  try {
    const now = new Date();

    const [
      totalProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      overdueTasks
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'Terminé' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Terminée' }),
      Task.countDocuments({ status: 'En cours' }),
      Task.countDocuments({ status: 'Non commencée' }),
      Task.countDocuments({
        status: { $ne: 'Terminée' },
        dueDate: { $lt: now }
      })
    ]);

    res.json({
      totalProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      overdueTasks
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;