const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { recalculateProjectStatus } = require('../utils/projectStatusHelper');

const router = express.Router();

// جلب المهام مع البحث والفلترة (Recherche et Filtrage)
router.get('/', protect, async (req, res) => {
  try {
    const { search, project, assignedTo, status, priority, dueDate } = req.query;
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (project) query.project = project;
    if (assignedTo) query.assignedTo = assignedTo;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (dueDate) {
      const targetDate = new Date(dueDate);
      targetDate.setHours(23, 59, 59, 999);
      query.dueDate = { $lte: targetDate };
    }

    const tasks = await Task.find(query)
      .populate('project', 'name startDate endDate status')
      .populate('assignedTo', 'name email role')
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// إضافة مهمة جديدة
router.post('/', protect, authorize('Administrateur', 'Chef de projet'), async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, project: projectId, assignedTo } = req.body;

    const parentProject = await Project.findById(projectId);
    if (!parentProject) {
      return res.status(404).json({ message: 'Le projet associé est introuvable.' });
    }

    // التثبت من تطابق تاريخ المهمة مع تواريخ المشروع
    const taskDue = new Date(dueDate);
    const projStart = new Date(parentProject.startDate);
    const projEnd = new Date(parentProject.endDate);
    projStart.setHours(0, 0, 0, 0);
    projEnd.setHours(23, 59, 59, 999);

    if (taskDue < projStart || taskDue > projEnd) {
      return res.status(400).json({
        message: `La date limite de la tâche doit être comprise entre le début (${projStart.toLocaleDateString()}) et la fin (${projEnd.toLocaleDateString()}) du projet.`
      });
    }

    // التثبت من وجود الموظف
    if (assignedTo) {
      const emp = await User.findById(assignedTo);
      if (!emp) {
        return res.status(400).json({ message: 'Impossible d\'affecter la tâche à un employé inexistant.' });
      }
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'Non commencée',
      priority: priority || 'Moyenne',
      dueDate,
      project: projectId,
      assignedTo: assignedTo || null
    });

    await recalculateProjectStatus(projectId);

    const populated = await Task.findById(task._id)
      .populate('project', 'name startDate endDate status')
      .populate('assignedTo', 'name email role');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// تعديل مهمة (أو تغيير حالتها من طرف الموظف)
router.put('/:id', protect, async (req, res) => {
  try {
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) return res.status(404).json({ message: 'Tâche introuvable' });

    const parentProject = await Project.findById(req.body.project || existingTask.project);

    if (req.body.dueDate && parentProject) {
      const taskDue = new Date(req.body.dueDate);
      const projStart = new Date(parentProject.startDate);
      const projEnd = new Date(parentProject.endDate);
      projStart.setHours(0, 0, 0, 0);
      projEnd.setHours(23, 59, 59, 999);

      if (taskDue < projStart || taskDue > projEnd) {
        return res.status(400).json({
          message: 'La date limite doit être cohérente avec les dates du projet.'
        });
      }
    }

    if (req.body.assignedTo) {
      const emp = await User.findById(req.body.assignedTo);
      if (!emp) {
        return res.status(400).json({ message: 'Employé inexistant.' });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('project', 'name startDate endDate status')
      .populate('assignedTo', 'name email role');

    await recalculateProjectStatus(updatedTask.project._id);

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// حذف مهمة
router.delete('/:id', protect, authorize('Administrateur', 'Chef de projet'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

    const projectId = task.project;
    await Task.findByIdAndDelete(req.params.id);
    await recalculateProjectStatus(projectId);

    res.json({ message: 'Tâche supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;