const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { recalculateProjectStatus } = require('../utils/projectStatusHelper');
const { recordActivity } = require('../utils/activityHelper');
const { getIO } = require('../socket');

const router = express.Router();

// Configuration de Multer pour le téléversement de fichiers (Section 4 - Attachments)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
});

// Helper de population standardisé
const populateTask = (query) => {
  return query
    .populate('project', 'name startDate endDate status')
    .populate('assignedTo', 'name email role')
    .populate('comments.user', 'name email role')
    .populate('attachments.uploadedBy', 'name email role');
};

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

    const tasks = await populateTask(Task.find(query)).sort({ dueDate: 1 });
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

    const populated = await populateTask(Task.findById(task._id));

    // Audit Trail & Notification en temps réel (Sections 1 & 7)
    await recordActivity({
      user: req.user._id,
      action: 'TASK_CREATED',
      targetType: 'Task',
      targetTitle: task.title,
      targetId: task._id,
      details: `Créée dans le projet "${parentProject.name}" avec priorité ${task.priority}`,
      notifyUser: assignedTo
    });

    const io = getIO();
    if (io) io.emit('kanban:task_created', populated);

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

    const previousStatus = existingTask.status;

    // Contrôle RBAC strict pour l'Employé
    if (req.user.role === 'Employé') {
      if (existingTask.assignedTo && existingTask.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Accès refusé : cette tâche est affectée à un autre employé.'
        });
      }

      const forbiddenFields = ['title', 'description', 'dueDate', 'project', 'priority', 'assignedTo'];
      const hasForbidden = forbiddenFields.some(field => req.body[field] !== undefined);
      if (hasForbidden) {
        return res.status(403).json({
          message: 'Accès refusé : les employés sont uniquement autorisés à modifier le statut de leurs tâches.'
        });
      }

      const allowedStatuses = ['Non commencée', 'En cours', 'Terminée'];
      if (!req.body.status || !allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: 'Statut de tâche invalide.' });
      }

      existingTask.status = req.body.status;
      await existingTask.save();
      await recalculateProjectStatus(existingTask.project);

      const populated = await populateTask(Task.findById(existingTask._id));

      // Journalisation de l'activité (Section 7) et broadcast Socket.io (Section 1)
      await recordActivity({
        user: req.user._id,
        action: 'TASK_STATUS_CHANGED',
        targetType: 'Task',
        targetTitle: existingTask.title,
        targetId: existingTask._id,
        details: `Statut changé de "${previousStatus}" à "${existingTask.status}"`,
      });

      const io = getIO();
      if (io) io.emit('kanban:task_updated', populated);

      return res.json(populated);
    }

    // Pour Administrateur et Chef de projet
    const targetProjectId = req.body.project || existingTask.project;
    const parentProject = await Project.findById(targetProjectId);

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

    const oldProjectId = existingTask.project.toString();
    const updateData = { ...req.body };
    if (updateData.assignedTo === '' || updateData.assignedTo === null) {
      updateData.assignedTo = null;
    }

    const updatedTask = await populateTask(
      Task.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
    );

    await recalculateProjectStatus(updatedTask.project._id);
    if (oldProjectId !== updatedTask.project._id.toString()) {
      await recalculateProjectStatus(oldProjectId);
    }

    const action = req.body.status && req.body.status !== previousStatus ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED';
    await recordActivity({
      user: req.user._id,
      action,
      targetType: 'Task',
      targetTitle: updatedTask.title,
      targetId: updatedTask._id,
      details: action === 'TASK_STATUS_CHANGED'
        ? `Statut passé à "${updatedTask.status}"`
        : `Mise à jour des informations de la tâche`,
      notifyUser: updatedTask.assignedTo?._id
    });

    const io = getIO();
    if (io) io.emit('kanban:task_updated', updatedTask);

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// إضافة تعليق على المهمة (Section A - Commentaires & Collaboration)
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Le commentaire ne peut pas être vide.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    task.comments.push({
      user: req.user._id,
      text: text.trim()
    });

    await task.save();

    const populated = await populateTask(Task.findById(task._id));

    await recordActivity({
      user: req.user._id,
      action: 'COMMENT_ADDED',
      targetType: 'Task',
      targetTitle: task.title,
      targetId: task._id,
      details: `Commentaire: "${text.trim().substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
      notifyUser: task.assignedTo
    });

    const io = getIO();
    if (io) io.emit('kanban:task_updated', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Section 3 : Sous-tâches & Checklists (Subtasks) ---

// Ajouter une sous-tâche
router.post('/:id/subtasks', protect, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Le titre de la sous-tâche est requis.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

    task.subtasks.push({ title: title.trim(), completed: false });
    await task.save();

    const populated = await populateTask(Task.findById(task._id));

    await recordActivity({
      user: req.user._id,
      action: 'SUBTASK_TOGGLED',
      targetType: 'Task',
      targetTitle: task.title,
      targetId: task._id,
      details: `Nouvelle étape ajoutée : "${title.trim()}"`
    });

    const io = getIO();
    if (io) io.emit('kanban:task_updated', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Basculer l'état coché/décoché d'une sous-tâche
router.patch('/:id/subtasks/:subtaskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Sous-tâche introuvable' });

    subtask.completed = req.body.completed !== undefined ? req.body.completed : !subtask.completed;
    await task.save();

    const populated = await populateTask(Task.findById(task._id));

    const io = getIO();
    if (io) io.emit('kanban:task_updated', populated);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Supprimer une sous-tâche
router.delete('/:id/subtasks/:subtaskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

    task.subtasks.pull(req.params.subtaskId);
    await task.save();

    const populated = await populateTask(Task.findById(task._id));

    const io = getIO();
    if (io) io.emit('kanban:task_updated', populated);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Section 4 : Téléversement de Pièces Jointes (Attachments) ---

router.post('/:id/attachments', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier sélectionné.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

    const attachment = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    task.attachments.push(attachment);
    await task.save();

    const populated = await populateTask(Task.findById(task._id));

    await recordActivity({
      user: req.user._id,
      action: 'ATTACHMENT_ADDED',
      targetType: 'Task',
      targetTitle: task.title,
      targetId: task._id,
      details: `Fichier joint : "${req.file.originalname}" (${Math.round(req.file.size / 1024)} Ko)`
    });

    const io = getIO();
    if (io) io.emit('kanban:task_updated', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Supprimer une pièce jointe
router.delete('/:id/attachments/:attachmentId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

    const att = task.attachments.id(req.params.attachmentId);
    if (att) {
      const filePath = path.join(__dirname, '../uploads', att.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      task.attachments.pull(req.params.attachmentId);
      await task.save();
    }

    const populated = await populateTask(Task.findById(task._id));

    const io = getIO();
    if (io) io.emit('kanban:task_updated', populated);

    res.json(populated);
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
    const taskTitle = task.title;

    await Task.findByIdAndDelete(req.params.id);
    await recalculateProjectStatus(projectId);

    await recordActivity({
      user: req.user._id,
      action: 'TASK_DELETED',
      targetType: 'Task',
      targetTitle: taskTitle,
      targetId: req.params.id,
      details: `Tâche supprimée définitivement`
    });

    const io = getIO();
    if (io) io.emit('kanban:task_deleted', { id: req.params.id, projectId });

    res.json({ message: 'Tâche supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
