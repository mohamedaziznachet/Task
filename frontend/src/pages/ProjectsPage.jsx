// frontend/src/pages/ProjectsPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FolderPlus,
  Calendar,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  FolderKanban,
} from 'lucide-react';

const ProjectsPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'Administrateur' || user?.role === 'Chef de projet';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // حالات النافذة المنبثقة (Modal) للإضافة أو التعديل
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des projets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '', startDate: '', endDate: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject._id}`, formData);
        setSuccessMsg('Projet modifié avec succès.');
      } else {
        await api.post('/projects', formData);
        setSuccessMsg('Projet créé avec succès.');
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde du projet.');
    }
  };

  const handleDelete = async (id, name) => {
    setError('');
    setSuccessMsg('');
    if (!window.confirm(`Voulez-vous vraiment supprimer le projet "${name}" ?`)) return;

    try {
      await api.delete(`/projects/${id}`);
      setSuccessMsg('Projet supprimé avec succès.');
      fetchProjects();
    } catch (err) {
      // هنا يظهر التنبيه متاع القاعدة: ممنوع فسخ مشروع فيه مهام
      setError(
        err.response?.data?.message ||
          'Impossible de supprimer ce projet car il contient des tâches.'
      );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Terminé':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'En cours':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Projets</h2>
          <p className="text-sm text-slate-400">
            Le statut de chaque projet est calculé automatiquement selon l'avancement de ses tâches.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nouveau Projet</span>
          </button>
        )}
      </div>

      {/* رسائل الخطأ أو النجاح */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* قائمة المشاريع */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Chargement des projets...</div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Aucun projet trouvé</h3>
          <p className="text-xs text-slate-400 mt-1">
            Commencez par créer un premier projet pour y affecter des tâches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj._id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-base text-white">{proj.name}</h3>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${getStatusBadge(
                      proj.status
                    )}`}
                  >
                    {proj.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 mb-4">
                  {proj.description || 'Aucune description fournie.'}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-3 mt-2 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    Début: {new Date(proj.startDate).toLocaleDateString()}
                  </span>
                  <span>Fin: {new Date(proj.endDate).toLocaleDateString()}</span>
                </div>

                {canManage && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => openEditModal(proj)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDelete(proj._id, proj.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal إضافة أو تعديل مشروع */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingProject ? 'Modifier le projet' : 'Créer un nouveau projet'}
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
                  Nom du projet (Unique) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Plateforme E-Commerce"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Objectifs et détails du projet..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold"
                >
                  {editingProject ? 'Enregistrer' : 'Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;