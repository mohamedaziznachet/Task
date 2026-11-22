const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');

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

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// تعديل مشروع
router.put('/:id', protect, authorize('Administrateur', 'Chef de projet'), async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, startDate, endDate },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// حذف مشروع (ممنوع إذا فيه مهام)
router.delete('/:id', protect, authorize('Administrateur', 'Chef de projet'), async (req, res) => {
  try {
    const taskCount = await Task.countDocuments({ project: req.params.id });
    if (taskCount > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer ce projet car il possède encore des tâches associées.'
      });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Projet supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;