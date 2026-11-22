// frontend/src/App.jsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import UsersPage from './pages/UsersPage';

const MainWorkspace = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060913] text-slate-300 flex items-center justify-center text-sm">
        Chargement de la plateforme...
      </div>
    );
  }

  // إذا المستخدم موش عامل Login، نخرجو صفحة الـ 3D Login
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'projects' && <ProjectsPage />}
        {activeTab === 'tasks' && <TasksPage />}
        {activeTab === 'users' && user.role === 'Administrateur' && <UsersPage />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainWorkspace />
    </AuthProvider>
  );
}