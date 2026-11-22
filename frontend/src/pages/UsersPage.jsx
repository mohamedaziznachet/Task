// frontend/src/pages/UsersPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  UserPlus,
  Shield,
  Trash2,
  Edit3,
  X,
  Mail,
  Check,
} from 'lucide-react';

const UsersPage = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employé',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      showError('Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'Employé' });
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser._id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
        showSuccess('Utilisateur mis à jour avec succès.');
      } else {
        await api.post('/auth/register', formData);
        showSuccess('Nouvel employé / utilisateur créé avec succès.');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'utilisateur "${name}" ?`)) return;

    try {
      await api.delete(`/auth/users/${id}`);
      showSuccess('Utilisateur supprimé avec succès.');
      fetchUsers();
    } catch (err) {
      showError(
        err.response?.data?.message ||
          'Impossible de supprimer cet employé car il possède encore des tâches "En cours".'
      );
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Administrateur':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'Chef de projet':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Employés & Utilisateurs</h2>
          <p className="text-sm text-slate-400">
            Administration des comptes et permissions. Règle de sécurité : un employé avec tâches &quot;En cours&quot; est protégé.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un Utilisateur</span>
        </button>
      </div>

      {/* Table des utilisateurs */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <th className="py-3.5 px-5">Nom Complet</th>
                <th className="py-3.5 px-5">Email</th>
                <th className="py-3.5 px-5">Rôle</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400 text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <span>Chargement des utilisateurs...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400 text-xs">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-5 font-medium text-white">{u.name}</td>
                    <td className="py-3.5 px-5 text-slate-400 text-xs font-mono">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {u.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout ou de modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingUser ? "Modifier l'utilisateur" : 'Nouvel employé / utilisateur'}
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
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mohamed Ben Ali"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nom@issat.tn"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Mot de passe initial *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Rôle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                >
                  <option value="Employé">Employé</option>
                  <option value="Chef de projet">Chef de projet</option>
                  <option value="Administrateur">Administrateur</option>
                </select>
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
                  <span>{submitting ? 'En cours...' : editingUser ? 'Enregistrer' : 'Créer le compte'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
