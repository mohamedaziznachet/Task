// frontend/src/pages/TasksPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  UserCheck,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

const TasksPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'Administrateur' || user?.role === 'Chef de projet';

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // حالات البحث والفلترة (4.d Recherche et filtrage)
  const [filters, setFilters] = useState({
    search: '',
    project: '',
    assignedTo: '',
    status: '',
    priority: '',
    dueDate: '',
  });

  // حالات النافذة المنبثقة (Modal) للإضافة أو التعديل
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Non commencée',
    priority: 'Moyenne',
    dueDate: '',
    project: '',
    assignedTo: '',
  });

  // جلب المشاريع والموظفين للـ Dropdowns
  const fetchInitialData = async () => {
    try {
      const [projRes, userRes] = await Promise.all([
        api.get('/projects'),
        api.get('/auth/users'),
      ]);
      setProjects(projRes.data);
      setEmployees(userRes.data);
    } catch (err) {
      console.error('Erreur chargement données initiales:', err);
    }
  };

  // جلب المهام مع الفلتر
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
      setError('Erreur lors du chargement des tâches.');
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
    setError('');
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
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const payload = {
      ...formData,
      assignedTo: formData.assignedTo || null,
    };

    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
        setSuccessMsg('Tâche mise à jour avec succès.');
      } else {
        await api.post('/tasks', payload);
        setSuccessMsg('Tâche créée avec succès.');
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Erreur lors de la sauvegarde de la tâche (vérifiez les dates du projet).'
      );
    }
  };

  // تغيير سريع لحالة المهمة (متاح للموظف والـ Chef والـ Admin)
  const handleQuickStatusChange = async (taskId, newStatus) => {
    setError('');
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de modifier le statut.');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer la tâche "${title}" ?`)) return;
    setError('');
    try {
      await api.delete(`/tasks/${id}`);
      setSuccessMsg('Tâche supprimée.');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression.');
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

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Tâches (Kanban)</h2>
          <p className="text-sm text-slate-400">
            Affectation, suivi d'avancement, recherche et filtrage multi-critères.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Tâche</span>
          </button>
        )}
      </div>

      {/* شريط البحث والفلترة (4.d Recherche et filtrage) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Filter className="w-4 h-4 text-sky-400" />
          <span>Recherche et Filtrage des Tâches</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* البحث بالعنوان */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par titre..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-sky-500"
            />
          </div>

          {/* فلتر المشروع */}
          <select
            value={filters.project}
            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          >
            <option value="">Tous les projets</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* فلتر الموظف */}
          <select
            value={filters.assignedTo}
            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          >
            <option value="">Tous les employés</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>

          {/* فلتر الحالة */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          >
            <option value="">Tous les statuts</option>
            <option value="Non commencée">Non commencée</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminée</option>
          </select>

          {/* فلتر الأولوية */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          >
            <option value="">Toutes priorités</option>
            <option value="Faible">Faible</option>
            <option value="Moyenne">Moyenne</option>
            <option value="Haute">Haute</option>
          </select>

          {/* فلتر تاريخ الانتهاء */}
          <input
            type="date"
            value={filters.dueDate}
            onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* رسائل الخطأ أو النجاح */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* أعمدة الـ Kanban الثلاثة */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Chargement des tâches...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((colStatus) => {
            const colTasks = tasks.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[420px]"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <span className="font-bold text-sm text-white">{colStatus}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">
                      Aucune tâche dans cette colonne
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isOverdue =
                        task.status !== 'Terminée' && new Date(task.dueDate) < new Date();
                      return (
                        <div
                          key={task._id}
                          className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition shadow"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-white">{task.title}</h4>
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

                          <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-900">
                            <div className="text-sky-400 font-medium">
                              📁 Projet: {task.project?.name || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                              <span>
                                Assigné à:{' '}
                                <strong className="text-slate-200">
                                  {task.assignedTo?.name || 'Non assigné (Facultatif)'}
                                </strong>
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-1.5 ${
                                isOverdue ? 'text-red-400 font-semibold' : ''
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                Échéance: {new Date(task.dueDate).toLocaleDateString()}
                                {isOverdue && ' (En retard!)'}
                              </span>
                            </div>
                          </div>

                          {/* تغيير الحالة + أزرار التعديل والحذف */}
                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleQuickStatusChange(task._id, e.target.value)
                              }
                              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-sky-500"
                            >
                              <option value="Non commencée">Non commencée</option>
                              <option value="En cours">En cours</option>
                              <option value="Terminée">Terminée</option>
                            </select>

                            {canManage && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  title="Modifier"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(task._id, task.title)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
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

      {/* Modal إضافة أو تعديل مهمة */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingTask ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Titre de la tâche *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Développement de l'API REST"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Projet associé (Obligatoire) *
                  </label>
                  <select
                    required
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                  >
                    <option value="">-- Sélectionner un projet --</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({new Date(p.startDate).toLocaleDateString()} -{' '}
                        {new Date(p.endDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Employé assigné (Facultatif)
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                  >
                    <option value="">-- Aucun employé --</option>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Statut *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                  >
                    <option value="Non commencée">Non commencée</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminée">Terminée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priorité *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                  >
                    <option value="Faible">Faible</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Date limite *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold"
                >
                  {editingTask ? 'Enregistrer' : 'Créer la tâche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;