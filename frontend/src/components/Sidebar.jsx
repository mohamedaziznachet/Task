import React from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'projects', label: 'Gestion des Projets', icon: FolderKanban },
    { id: 'tasks', label: 'Gestion des Tâches', icon: CheckSquare },
  ];

  // الـ Administrateur برك ينجم يدخل لإدارة الموظفين والمستخدمين
  if (user?.role === 'Administrateur') {
    navItems.push({ id: 'users', label: 'Employés & Utilisateurs', icon: Users });
  }

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between min-h-screen p-4 shrink-0">
      <div>
        {/* شعار المنصة عالي الأداء */}
        <div className="px-3 py-4 border-b border-slate-800 mb-6">
          <Logo size="md" />
        </div>

        {/* أزرار التنقل */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* معلومات المستخدم + زر الخروج */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
          <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
          <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <ShieldCheck className="w-3 h-3" />
            {user?.role}
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
  );
};

export default Sidebar;