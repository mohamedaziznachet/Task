const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');
const { recordActivity } = require('../utils/activityHelper');
const { getIO } = require('../socket');

const router = express.Router();

// جلب كل المشاريع
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// إنشاء مشروع جديد
router.post('/', protect, authorize('Administrateur', 'Chef de projet'), async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Le nom, la date de début et la date de fin sont requis.' });
    }

    const existing = await Project.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Le nom du projet doit être unique.' });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'La date de fin doit être postérieure à la date de début.' });
    }

    const project = await Project.create({
      name: name.trim(),
      description,
      startDate,
      endDate,
      status: 'Non commencé',
      createdBy: req.user._id
    });

    await recordActivity({
      user: req.user._id,
      action: 'PROJECT_CREATED',
      targetType: 'Project',
      targetTitle: project.name,
      targetId: project._id,
      details: `Du ${new Date(startDate).toLocaleDateString()} au ${new Date(endDate).toLocaleDateString()}`
    });

    const io = getIO();
    if (io) io.emit('project:created', project);

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// تعديل مشروع
router.put('/:id', protect, authorize('Administrateur', 'Chef de projet'), async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;

    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Projet introuvable' });

    const newStart = startDate ? new Date(startDate) : existing.startDate;
    const newEnd = endDate ? new Date(endDate) : existing.endDate;

    if (newEnd < newStart) {
      return res.status(400).json({ message: 'La date de fin doit être postérieure à la date de début.' });
    }

    if (name && name.trim() !== existing.name) {
      const duplicate = await Project.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (duplicate) {
        return res.status(400).json({ message: 'Le nom du projet doit être unique.' });
      }
    }

    if (startDate || endDate) {
      const projStart = new Date(newStart);
      const projEnd = new Date(newEnd);
      projStart.setHours(0, 0, 0, 0);
      projEnd.setHours(23, 59, 59, 999);

      const tasks = await Task.find({ project: req.params.id });
      const conflictingTask = tasks.find(t => {
        const taskDue = new Date(t.dueDate);
        return taskDue < projStart || taskDue > projEnd;
      });

      if (conflictingTask) {
        return res.status(400).json({
          message: `Conflit de dates : la tâche "${conflictingTask.title}" a une échéance en dehors du nouvel intervalle (${projStart.toLocaleDateString()} - ${projEnd.toLocaleDateString()}).`
        });
      }
    }

    const updates = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(startDate && { startDate: newStart }),
      ...(endDate && { endDate: newEnd })
    };

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    await recordActivity({
      user: req.user._id,
      action: 'PROJECT_UPDATED',
      targetType: 'Project',
      targetTitle: project.name,
      targetId: project._id,
      details: `Mise à jour des paramètres du projet`
    });

    const io = getIO();
    if (io) io.emit('project:updated', project);

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// حذف مشروع
router.delete('/:id', protect, authorize('Administrateur', 'Chef de projet'), async (req, res) => {
  try {
    const taskCount = await Task.countDocuments({ project: req.params.id });
    if (taskCount > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer ce projet car il possède encore des tâches associées.'
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });

    const projectName = project.name;
    await Project.findByIdAndDelete(req.params.id);

    await recordActivity({
      user: req.user._id,
      action: 'PROJECT_DELETED',
      targetType: 'Project',
      targetTitle: projectName,
      targetId: req.params.id,
      details: `Projet supprimé`
    });

    const io = getIO();
    if (io) io.emit('project:deleted', { id: req.params.id });

    res.json({ message: 'Projet supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
