// frontend/src/pages/TasksPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import CalendarView from '../components/CalendarView';
import GanttView from '../components/GanttView';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  UserCheck,
  Edit3,
  Trash2,
  X,
  MessageSquare,
  Send,
  Check,
  GripVertical,
  Kanban,
  GanttChartSquare,
  CheckSquare,
  Paperclip,
  Upload,
  Download,
  File,
} from 'lucide-react';

const TasksPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { socket } = useSocket();
  const canManage = user?.role === 'Administrateur' || user?.role === 'Chef de projet';

  // Mode d'affichage : Kanban, Calendrier ou Gantt (Section 2)
  const [viewMode, setViewMode] = useState('kanban');

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recherche et filtrage
  const [filters, setFilters] = useState({
    search: '',
    project: '',
    assignedTo: '',
    status: '',
    priority: '',
    dueDate: '',
  });

  // Modal d'ajout / modification de tâche
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Non commencée',
    priority: 'Moyenne',
    dueDate: '',
    project: '',
    assignedTo: '',
  });

  // Modal détaillée de la tâche (Sous-tâches, Pièces jointes, Commentaires)
  const [activeTask, setActiveTask] = useState(null);
  const [detailTab, setDetailTab] = useState('subtasks'); // 'subtasks' | 'attachments' | 'comments'
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // État du Drag and Drop
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const fetchInitialData = async () => {
    try {
      const [projRes, userRes] = await Promise.all([
        api.get('/projects'),
        api.get('/auth/users'),
      ]);
      setProjects(projRes.data);
      setEmployees(userRes.data);
    } catch (err) {
      console.error('Erreur chargement projets/utilisateurs:', err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.project) params.project = filters.project;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.dueDate) params.dueDate = filters.dueDate;

      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch (err) {
      showError('Erreur lors du chargement des tâches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Synchronisation en direct via Socket.io (Section 1)
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => [newTask, ...prev.filter((t) => t._id !== newTask._id)]);
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      setActiveTask((current) => (current?._id === updatedTask._id ? updatedTask : current));
    };

    const handleTaskDeleted = ({ id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setActiveTask((current) => (current?._id === id ? null : current));
    };

    socket.on('kanban:task_created', handleTaskCreated);
    socket.on('kanban:task_updated', handleTaskUpdated);
    socket.on('kanban:task_deleted', handleTaskDeleted);

    return () => {
      socket.off('kanban:task_created', handleTaskCreated);
      socket.off('kanban:task_updated', handleTaskUpdated);
      socket.off('kanban:task_deleted', handleTaskDeleted);
    };
  }, [socket]);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'Non commencée',
      priority: 'Moyenne',
      dueDate: '',
      project: projects[0]?._id || '',
      assignedTo: '',
    });
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      project: task.project?._id || task.project || '',
      assignedTo: task.assignedTo?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      assignedTo: formData.assignedTo || null,
    };

    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
        showSuccess('Tâche mise à jour avec succès.');
      } else {
        await api.post('/tasks', payload);
        showSuccess('Tâche créée avec succès.');
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      showError(
        err.response?.data?.message ||
          'Erreur lors de la sauvegarde (vérifiez les dates du projet).'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      showSuccess(`Statut passé à "${newStatus}".`);
      fetchTasks();
    } catch (err) {
      showError(err.response?.data?.message || 'Action non autorisée sur cette tâche.');
    }
  };

  // Drag and Drop (Section A)
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colStatus) {
      setDragOverColumn(colStatus);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== targetStatus) {
      await handleStatusChange(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer la tâche "${title}" ?`)) return;
    try {
      await api.delete(`/tasks/${id}`);
      showSuccess('Tâche supprimée avec succès.');
      fetchTasks();
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  // --- Gestion des Sous-tâches (Section 3) ---
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !activeTask) return;

    try {
      const res = await api.post(`/tasks/${activeTask._id}/subtasks`, {
        title: newSubtaskTitle.trim(),
      });
      setActiveTask(res.data);
      setNewSubtaskTitle('');
      showSuccess('Sous-tâche ajoutée.');
      fetchTasks();
    } catch (err) {
      showError('Erreur lors de l’ajout de la sous-tâche.');
    }
  };

  const handleToggleSubtask = async (subtaskId, currentCompleted) => {
    try {
      const res = await api.patch(`/tasks/${activeTask._id}/subtasks/${subtaskId}`, {
        completed: !currentCompleted,
      });
      setActiveTask(res.data);
      fetchTasks();
    } catch (err) {
      showError('Impossible de mettre à jour la sous-tâche.');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const res = await api.delete(`/tasks/${activeTask._id}/subtasks/${subtaskId}`);
      setActiveTask(res.data);
      fetchTasks();
    } catch (err) {
      showError('Erreur lors de la suppression de la sous-tâche.');
    }
  };

  // --- Gestion des Fichiers / Pièces Jointes (Section 4) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeTask) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    setUploadingFile(true);
    try {
      const res = await api.post(`/tasks/${activeTask._id}/attachments`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setActiveTask(res.data);
      showSuccess(`Fichier "${file.name}" attaché.`);
      fetchTasks();
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors du téléversement.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Supprimer cette pièce jointe ?')) return;
    try {
      const res = await api.delete(`/tasks/${activeTask._id}/attachments/${attachmentId}`);
      setActiveTask(res.data);
      showSuccess('Fichier supprimé.');
      fetchTasks();
    } catch (err) {
      showError('Erreur lors de la suppression du fichier.');
    }
  };

  // --- Gestion des Commentaires ---
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeTask) return;

    try {
      const res = await api.post(`/tasks/${activeTask._id}/comments`, {
        text: newCommentText.trim(),
      });
      setActiveTask(res.data);
      setNewCommentText('');
      showSuccess('Commentaire publié.');
      fetchTasks();
    } catch (err) {
      showError('Erreur lors de l’envoi du commentaire.');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Haute':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'Moyenne':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const columns = ['Non commencée', 'En cours', 'Terminée'];
  const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(
    /\/api\/?$/,
    ''
  );

  return (
    <div className="space-y-6">
      {/* En-tête avec Sélecteur de Vue (Kanban / Calendrier / Gantt) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Espace de Travail & Planification</h2>
          <p className="text-sm text-slate-400">
            Basculez entre le Kanban dynamique, le Calendrier mensuel et la Frise de Gantt.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Boutons Sélecteur de Vue */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'calendar'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendrier</span>
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'gantt'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GanttChartSquare className="w-3.5 h-3.5" />
              <span>Gantt</span>
            </button>
          </div>

          {canManage && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Tâche</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre de Recherche et Filtrage */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Filter className="w-4 h-4 text-sky-400" />
          <span>Filtres multi-critères</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par titre..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
            />
          </div>

          <select
            value={filters.project}
            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
          >
            <option value="">Tous les projets</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filters.assignedTo}
            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
          >
            <option value="">Tous les employés</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
          >
            <option value="">Tous les statuts</option>
            <option value="Non commencée">Non commencée</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminée</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
          >
            <option value="">Toutes priorités</option>
            <option value="Faible">Faible</option>
            <option value="Moyenne">Moyenne</option>
            <option value="Haute">Haute</option>
          </select>

          <input
            type="date"
            value={filters.dueDate}
            onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* Rendu dynamique selon viewMode */}
      {viewMode === 'calendar' && (
        <CalendarView tasks={tasks} onSelectTask={(t) => setActiveTask(t)} />
      )}

      {viewMode === 'gantt' && (
        <GanttView
          projects={projects}
          tasks={tasks}
          onSelectTask={(t) => setActiveTask(t)}
        />
      )}

      {viewMode === 'kanban' && (
        <>
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm flex items-center justify-center gap-2.5">
              <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>Chargement du tableau Kanban...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {columns.map((colStatus) => {
                const colTasks = tasks.filter((t) => t.status === colStatus);
                const isDragTarget = dragOverColumn === colStatus;

                return (
                  <div
                    key={colStatus}
                    onDragOver={(e) => handleDragOver(e, colStatus)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, colStatus)}
                    className={`rounded-2xl p-4 flex flex-col min-h-[460px] transition-all duration-200 border ${
                      isDragTarget
                        ? 'bg-sky-500/10 border-sky-400/80 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-900/50 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{colStatus}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Glisser ici</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1">
                      {colTasks.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                          Déposer une tâche ici
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const isOverdue =
                            task.status !== 'Terminée' && new Date(task.dueDate) < new Date();
                          const commentCount = task.comments?.length || 0;
                          const attachmentCount = task.attachments?.length || 0;
                          const subtaskTotal = task.subtasks?.length || 0;
                          const subtaskCompleted =
                            task.subtasks?.filter((s) => s.completed).length || 0;
                          const subtaskPercent =
                            subtaskTotal > 0
                              ? Math.round((subtaskCompleted / subtaskTotal) * 100)
                              : 0;

                          const isAssignedToCurrent =
                            task.assignedTo?._id === user?._id || task.assignedTo === user?._id;
                          const canEmployeeMove =
                            user?.role === 'Administrateur' ||
                            user?.role === 'Chef de projet' ||
                            isAssignedToCurrent ||
                            !task.assignedTo;

                          return (
                            <div
                              key={task._id}
                              draggable={canEmployeeMove}
                              onDragStart={(e) => handleDragStart(e, task._id)}
                              className={`bg-slate-950/90 border rounded-xl p-4 space-y-3 transition shadow-md select-none ${
                                draggedTaskId === task._id
                                  ? 'opacity-40 border-sky-400'
                                  : 'border-slate-800 hover:border-slate-700'
                              } ${canEmployeeMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {canEmployeeMove && (
                                    <GripVertical className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                  )}
                                  <h4
                                    onClick={() => setActiveTask(task)}
                                    className="font-semibold text-sm text-white leading-snug cursor-pointer hover:text-sky-300 transition"
                                  >
                                    {task.title}
                                  </h4>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${getPriorityBadge(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority}
                                </span>
                              </div>

                              {task.description && (
                                <p className="text-xs text-slate-400 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Barre de progression des sous-tâches (Section 3) */}
                              {subtaskTotal > 0 && (
                                <div className="space-y-1 pt-1">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <CheckSquare className="w-3 h-3 text-sky-400" />
                                      <span>Étapes</span>
                                    </span>
                                    <span>
                                      {subtaskCompleted}/{subtaskTotal} ({subtaskPercent}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                    <div
                                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                                      style={{ width: `${subtaskPercent}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="text-[11px] text-slate-400 space-y-1.5 pt-1 border-t border-slate-900">
                                <div className="text-sky-400 font-medium truncate">
                                  📁 Projet: {task.project?.name || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="truncate">
                                    Assigné à:{' '}
                                    <strong className="text-slate-200">
                                      {task.assignedTo?.name || 'Non assigné'}
                                    </strong>
                                  </span>
                                </div>
                                <div
                                  className={`flex items-center gap-1.5 font-mono ${
                                    isOverdue ? 'text-red-400 font-semibold' : ''
                                  }`}
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>
                                    Échéance: {new Date(task.dueDate).toLocaleDateString()}
                                    {isOverdue && ' (Retard !)'}
                                  </span>
                                </div>
                              </div>

                              {/* Badges Fichiers & Commentaires + Sélecteur */}
                              <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setActiveTask(task);
                                      setDetailTab('subtasks');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition"
                                    title="Détails, sous-tâches et fichiers"
                                  >
                                    <CheckSquare className="w-3 h-3 text-sky-400" />
                                    <span>{subtaskTotal}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveTask(task);
                                      setDetailTab('attachments');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition"
                                    title="Pièces jointes"
                                  >
                                    <Paperclip className="w-3 h-3 text-purple-400" />
                                    <span>{attachmentCount}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveTask(task);
                                      setDetailTab('comments');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition"
                                    title="Commentaires"
                                  >
                                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                                    <span>{commentCount}</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-sky-500"
                                  >
                                    <option value="Non commencée">Non commencée</option>
                                    <option value="En cours">En cours</option>
                                    <option value="Terminée">Terminée</option>
                                  </select>

                                  {canManage && (
                                    <>
                                      <button
                                        onClick={() => openEditModal(task)}
                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                        title="Modifier"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(task._id, task.title)}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal d'ajout / modification de tâche */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingTask ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Titre de la tâche *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Conception API Backend"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails techniques et critères de réalisation..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Projet associé *
                  </label>
                  <select
                    required
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                  >
                    <option value="">-- Sélectionner un projet --</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Employé assigné
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                  >
                    <option value="">-- Aucun employé (Non assigné) --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Statut *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                  >
                    <option value="Non commencée">Non commencée</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminée">Terminée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Priorité *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                  >
                    <option value="Faible">Faible</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Date limite *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{submitting ? 'En cours...' : editingTask ? 'Enregistrer' : 'Créer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détaillée de la Tâche (Sous-tâches, Pièces Jointes, Commentaires) */}
      {activeTask && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* En-tête */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadge(
                      activeTask.priority
                    )}`}
                  >
                    {activeTask.priority}
                  </span>
                  <span className="text-xs text-slate-400">
                    📁 {activeTask.project?.name || 'N/A'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{activeTask.title}</h3>
                <p className="text-xs text-slate-400">
                  Assigné à :{' '}
                  <strong className="text-slate-200">
                    {activeTask.assignedTo?.name || 'Non assigné'}
                  </strong>{' '}
                  • Échéance :{' '}
                  <span className="font-mono text-sky-400">
                    {new Date(activeTask.dueDate).toLocaleDateString()}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            {activeTask.description && (
              <div className="py-2.5 text-xs text-slate-300 border-b border-slate-800/80">
                {activeTask.description}
              </div>
            )}

            {/* Onglets Intérieurs : Sous-tâches | Pièces jointes | Commentaires */}
            <div className="flex items-center gap-1 border-b border-slate-800 pt-3 pb-2">
              <button
                onClick={() => setDetailTab('subtasks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  detailTab === 'subtasks'
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Sous-tâches ({activeTask.subtasks?.length || 0})</span>
              </button>
              <button
                onClick={() => setDetailTab('attachments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  detailTab === 'attachments'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Fichiers ({activeTask.attachments?.length || 0})</span>
              </button>
              <button
                onClick={() => setDetailTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  detailTab === 'comments'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Commentaires ({activeTask.comments?.length || 0})</span>
              </button>
            </div>

            {/* Contenu de l'onglet actif */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {/* Onglet 1: Sous-tâches (Section 3) */}
              {detailTab === 'subtasks' && (
                <div className="space-y-3">
                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Ajouter une étape / sous-tâche..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                    />
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim()}
                      className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      Ajouter
                    </button>
                  </form>

                  {(!activeTask.subtasks || activeTask.subtasks.length === 0) ? (
                    <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      Aucune sous-tâche définie. Décomposez le travail en étapes !
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeTask.subtasks.map((st) => (
                        <div
                          key={st._id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 text-xs">
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => handleToggleSubtask(st._id, st.completed)}
                              className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                            />
                            <span
                              className={`transition ${
                                st.completed
                                  ? 'line-through text-slate-500'
                                  : 'text-slate-200 font-medium'
                              }`}
                            >
                              {st.title}
                            </span>
                          </label>

                          <button
                            onClick={() => handleDeleteSubtask(st._id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                            title="Supprimer la sous-tâche"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Onglet 2: Pièces Jointes (Section 4) */}
              {detailTab === 'attachments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-300">
                      Téléversez des fichiers (PDF, Images, Documents - Max 10 Mo)
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingFile ? 'Envoi...' : 'Choisir un fichier'}</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {(!activeTask.attachments || activeTask.attachments.length === 0) ? (
                    <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      Aucun fichier joint à cette tâche.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeTask.attachments.map((att) => (
                        <div
                          key={att._id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                        >
                          <div className="flex items-center gap-2.5 truncate flex-1">
                            <File className="w-4 h-4 text-purple-400 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-semibold text-white truncate">
                                {att.originalName}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {Math.round(att.size / 1024)} Ko •{' '}
                                {new Date(att.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`${backendBaseUrl}${att.path}`}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition"
                              title="Télécharger le fichier"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(att._id)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Onglet 3: Commentaires */}
              {detailTab === 'comments' && (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(!activeTask.comments || activeTask.comments.length === 0) ? (
                      <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        Aucun commentaire. Démarrez la discussion !
                      </div>
                    ) : (
                      activeTask.comments.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-sky-400">
                              {c.user?.name || 'Utilisateur'}
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
                    <input
                      type="text"
                      required
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Votre message / commentaire..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
