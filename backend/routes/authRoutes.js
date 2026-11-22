const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');
const { recordActivity } = require('../utils/activityHelper');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_issat_2026';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// تسجيل حساب جديد
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    let assignedRole = 'Employé';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const requester = await User.findById(decoded.id);
        if (requester && requester.role === 'Administrateur' && req.body.role) {
          const allowedRoles = ['Administrateur', 'Chef de projet', 'Employé'];
          if (allowedRoles.includes(req.body.role)) {
            assignedRole = req.body.role;
          }
        }
      } catch (e) {
        // En cas de token invalide, le rôle reste 'Employé'
      }
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// تسجيل الدخول (Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// تحديث الملف الشخصي وتغيير كلمة السر (Section A - Profil Utilisateur)
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (name) {
      user.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Le mot de passe actuel est requis pour définir un nouveau mot de passe.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// جلب قائمة الموظفين والمستخدمين
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// تعديل مستخدم (خاص بالـ Administrateur لتعديل الرتب والمستخدمين)
router.put('/users/:id', protect, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (role && role !== targetUser.role) {
      if (req.user.role !== 'Administrateur') {
        return res.status(403).json({
          message: 'Seul un Administrateur est autorisé à modifier le rôle d’un utilisateur.'
        });
      }
      const allowedRoles = ['Administrateur', 'Chef de projet', 'Employé'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Rôle invalide' });
      }
    }

    if (req.user.role !== 'Administrateur' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        message: 'Action non autorisée'
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (req.user.role === 'Administrateur' && role) {
      updates.role = role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (role && role !== targetUser.role) {
      await recordActivity({
        user: req.user._id,
        action: 'ROLE_UPDATED',
        targetType: 'User',
        targetTitle: targetUser.name,
        targetId: targetUser._id,
        details: `Rôle mis à niveau de "${targetUser.role}" à "${role}"`,
        notifyUser: targetUser._id
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// حذف موظف (مع التثبت من القاعدة: ما يتفسخش كان عندو مهام En cours)
router.delete('/users/:id', protect, authorize('Administrateur'), async (req, res) => {
  try {
    const activeTasksCount = await Task.countDocuments({
      assignedTo: req.params.id,
      status: 'En cours'
    });

    if (activeTasksCount > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer cet employé car il possède encore des tâches "En cours".'
      });
    }

    await Task.updateMany({ assignedTo: req.params.id }, { assignedTo: null });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
