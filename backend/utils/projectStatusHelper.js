const Task = require('../models/Task');
const Project = require('../models/Project');

async function recalculateProjectStatus(projectId) {
  const tasks = await Task.find({ project: projectId });

  let newStatus = 'Non commencé';

  if (tasks.length === 0) {
    newStatus = 'Non commencé';
  } else {
    const allNotStarted = tasks.every(t => t.status === 'Non commencée');
    const allCompleted = tasks.every(t => t.status === 'Terminée');

    if (allNotStarted) {
      newStatus = 'Non commencé';
    } else if (allCompleted) {
      newStatus = 'Terminé';
    } else {
      newStatus = 'En cours';
    }
  }

  await Project.findByIdAndUpdate(projectId, { status: newStatus });
  return newStatus;
}

module.exports = { recalculateProjectStatus };