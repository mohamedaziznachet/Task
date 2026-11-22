// frontend/src/components/ProfileModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, User, Lock, ShieldCheck, Check } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      showError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      showError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      showSuccess('Profil mis à jour avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mon Profil</h3>
              <p className="text-xs text-slate-400">Gérez vos informations personnelles</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Adresse Email (Identifiant fixe)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Rôle Attribué
            </label>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{user?.role}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nom complet
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500 transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-400" />
              Changement de mot de passe (Facultatif)
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 car."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirmer
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Min 6 car."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
