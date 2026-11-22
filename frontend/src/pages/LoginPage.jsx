// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Guardian3D from '../components/Guardian3D';
import Logo from '../components/Logo';
import { Shield, Mail, Lock, User, AlertCircle, Zap } from 'lucide-react';

const LoginPage = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [visualMode, setVisualMode] = useState('idle');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      setVisualMode('success');
    } catch (err) {
      setVisualMode('error');
      setError(
        err.response?.data?.message ||
          'Erreur de connexion au serveur (vérifiez que le backend tourne sur le port 5000)'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex items-center justify-center p-4 md:p-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        
        {/* الجزء الأيسر: المشهد الـ 3D التفاعلي */}
        <div className="lg:col-span-6 relative bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-900 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div className="flex items-center justify-between z-10">
            <Logo size="md" />
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
              60 FPS High-Perf
            </span>
          </div>

          {/* المجسم الـ 3D */}
          <div className="my-auto h-72 md:h-80 w-full relative">
            <Guardian3D mode={visualMode} passwordLength={password.length} />
          </div>

          <div className="z-10 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sky-400" />
              Système Multi-Acteurs Sécurisé (JWT)
            </div>
            <p>
              Le noyau 3D réagit en temps réel à vos saisies. Rôles supportés :{' '}
              <span className="text-sky-300">Administrateur</span>,{' '}
              <span className="text-indigo-300">Chef de projet</span>, et{' '}
              <span className="text-emerald-300">Employé</span>.
            </p>
          </div>
        </div>

        {/* الجزء الأيمن: استمارة الدخول أو التسجيل */}
        <div className="lg:col-span-6 p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              {isRegister ? 'Créer un compte employé' : 'Connexion à la plateforme'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isRegister
                ? 'Inscrivez-vous pour rejoindre l’espace de travail en tant qu’Employé.'
                : 'Entrez vos identifiants pour accéder à votre tableau de bord.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setVisualMode('idle')}
                    placeholder="Ex: Ali Ben Salah"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setVisualMode('idle')}
                  placeholder="ali@issat.tn"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setVisualMode('password')}
                  onBlur={() => setVisualMode('idle')}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {submitting
                ? 'Chargement...'
                : isRegister
                ? "S'inscrire et Accéder"
                : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs text-sky-400 hover:text-sky-300 underline"
            >
              {isRegister
                ? 'Vous avez déjà un compte ? Connectez-vous'
                : "Pas encore de compte ? Créer un compte"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;