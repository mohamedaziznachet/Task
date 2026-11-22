// backend/utils/activityHelper.js
const Activity = require('../models/Activity');
const { getIO } = require('../socket');

async function recordActivity({ user, action, targetType, targetTitle, targetId, details, notifyUser }) {
  try {
    const activity = await Activity.create({
      user,
      action,
      targetType,
      targetTitle,
      targetId,
      details,
    });

    const populated = await Activity.findById(activity._id)
      .populate('user', 'name email role');

    const io = getIO();
    if (io) {
      // Diffusion en temps réel de l'activité globale
      io.emit('activity:new', populated);

      // Notification ciblée si un utilisateur spécifique est concerné
      if (notifyUser && notifyUser.toString() !== user.toString()) {
        io.to(`user:${notifyUser}`).emit('notification:new', {
          id: activity._id,
          action,
          targetType,
          targetTitle,
          details,
          from: populated.user?.name || 'Un membre de l’équipe',
          createdAt: activity.createdAt,
        });
      }
    }

    return populated;
  } catch (error) {
    console.error('Erreur enregistrement activité:', error.message);
  }
}

module.exports = { recordActivity };
