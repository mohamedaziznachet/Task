// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ProfileModal from './ProfileModal';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  LogOut,
  ShieldCheck,
  User,
  X,
  History,
} from 'lucide-react';

const Sidebar = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/projects', label: 'Gestion des Projets', icon: FolderKanban },
    { to: '/tasks', label: 'Gestion des Tâches', icon: CheckSquare },
    { to: '/activity', label: "Journal d'Audit", icon: History },
  ];

  if (user?.role === 'Administrateur') {
    navItems.push({ to: '/users', label: 'Employés & Utilisateurs', icon: Users });
  }

  return (
    <>
      <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between h-full p-4 shrink-0">
        <div>
          {/* En-tête avec Logo et bouton fermeture mobile */}
          <div className="flex items-center justify-between px-2 py-3 border-b border-slate-800 mb-6">
            <Logo size="md" />
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation avec react-router-dom */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onCloseMobile && onCloseMobile()}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Profil utilisateur et actions */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div
            onClick={() => setShowProfileModal(true)}
            className="group bg-slate-950/70 border border-slate-800/80 hover:border-sky-500/40 rounded-xl p-3 cursor-pointer transition shadow-sm"
            title="Cliquer pour modifier votre profil"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition">
                {user?.name}
              </div>
              <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition" />
            </div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-3 h-3" />
              <span>{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Modal du Profil */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};

export default Sidebar;
