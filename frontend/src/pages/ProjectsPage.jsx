// frontend/src/pages/ProjectsPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FolderPlus,
  Calendar,
  Edit3,
  Trash2,
  X,
  FolderKanban,
  Check,
} from 'lucide-react';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const canManage = user?.role === 'Administrateur' || user?.role === 'Chef de projet';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal d'ajout ou de modification
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
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
      showError('Erreur lors du chargement des projets.');
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
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      showError('La date de fin doit être postérieure ou égale à la date de début.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject._id}`, formData);
        showSuccess('Projet modifié avec succès.');
      } else {
        await api.post('/projects', formData);
        showSuccess('Nouveau projet créé avec succès.');
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors de la sauvegarde du projet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le projet "${name}" ?`)) return;

    try {
      await api.delete(`/projects/${id}`);
      showSuccess('Projet supprimé avec succès.');
      fetchProjects();
    } catch (err) {
      showError(
        err.response?.data?.message ||
          'Impossible de supprimer ce projet car il possède encore des tâches associées.'
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
      {/* En-tête de la page */}
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

      {/* Liste des projets */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm flex items-center justify-center gap-2.5">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Chargement des projets...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
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
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition shadow-lg hover:shadow-sky-500/5 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-base text-white group-hover:text-sky-300 transition line-clamp-1">
                    {proj.name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${getStatusBadge(
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
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    {new Date(proj.startDate).toLocaleDateString()}
                  </span>
                  <span className="text-slate-500">➜</span>
                  <span className="text-slate-300">{new Date(proj.endDate).toLocaleDateString()}</span>
                </div>

                {canManage && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                    <button
                      onClick={() => openEditModal(proj)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDelete(proj._id, proj.name)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition"
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

      {/* Modal d'ajout ou de modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingProject ? 'Modifier le projet' : 'Créer un nouveau projet'}
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
                  Nom du projet (Unique) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Plateforme E-Commerce"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Objectifs et livrables attendus..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                  <span>{submitting ? 'En cours...' : editingProject ? 'Enregistrer' : 'Créer'}</span>
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
