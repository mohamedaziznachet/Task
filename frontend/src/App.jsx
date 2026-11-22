// frontend/src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import UsersPage from './pages/UsersPage';
import ActivityPage from './pages/ActivityPage';
import NotificationBell from './components/NotificationBell';
import Logo from './components/Logo';
import { Menu, X } from 'lucide-react';

const MainWorkspace = () => {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060913] text-slate-300 flex items-center justify-center text-sm font-medium">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Chargement de la plateforme TaskFlow...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col md:flex-row">
      {/* Barre supérieure Mobile (Header Responsive) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800 shrink-0">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Bureau (Desktop) */}
      <div className="hidden md:flex shrink-0 min-h-screen">
        <Sidebar />
      </div>

      {/* Tiroir Mobile (Drawer Overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex-1 max-w-xs w-full bg-slate-900 shadow-2xl h-full">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Contenu Principal avec Router */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barre supérieure Desktop avec cloche de notifications */}
        <div className="hidden md:flex items-center justify-end px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <NotificationBell />
        </div>

        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route
              path="/users"
              element={
                user.role === 'Administrateur' ? (
                  <UsersPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <MainWorkspace />
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
