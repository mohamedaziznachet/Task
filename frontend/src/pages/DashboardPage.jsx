// frontend/src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Award,
  RefreshCw,
  Download,
} from 'lucide-react';

const DashboardPage = () => {
  const { showSuccess, showError } = useToast();
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    notStartedTasks: 0,
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async (isManual = false) => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
      if (isManual) {
        showSuccess('Statistiques actualisées en temps réel.');
      }
    } catch (err) {
      showError('Erreur lors du chargement des statistiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const completionRate =
    stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  const projectCompletionRate =
    stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;

  // Fonction d'exportation de rapport CSV (Section A - Exportation de rapport)
  const exportReport = () => {
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const timeStr = new Date().toLocaleTimeString('fr-FR');
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `RAPPORT D'AVANCEMENT GLOBAL - TASKFLOW`,
        `Généré le;${dateStr} à ${timeStr}`,
        ``,
        `Indicateur;Valeur;Détails`,
        `Nombre total de projets;${stats.totalProjects};Projets enregistrés`,
        `Projets terminés;${stats.completedProjects};${projectCompletionRate}% d'achèvement`,
        `Nombre total de tâches;${stats.totalTasks};Toutes priorités confondues`,
        `Tâches terminées;${stats.completedTasks};${completionRate}% d'avancement global`,
        `Tâches en cours;${stats.inProgressTasks};En cours d'exécution`,
        `Tâches non commencées;${stats.notStartedTasks};En attente de démarrage`,
        `Tâches en retard;${stats.overdueTasks};Date limite dépassée`,
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rapport_TaskFlow_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Rapport CSV téléchargé avec succès.');
  };

  const cards = [
    {
      title: 'Nombre de projets',
      value: stats.totalProjects,
      sub: `${stats.completedProjects} projet(s) terminé(s)`,
      icon: FolderKanban,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30',
    },
    {
      title: 'Projets terminés',
      value: stats.completedProjects,
      sub: `Taux: ${projectCompletionRate}%`,
      icon: Award,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
    },
    {
      title: 'Nombre total de tâches',
      value: stats.totalTasks,
      sub: `Taux d'avancement: ${completionRate}%`,
      icon: ListTodo,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      title: 'Tâches terminées',
      value: stats.completedTasks,
      sub: 'Statut : Terminée',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      title: 'Tâches en cours',
      value: stats.inProgressTasks,
      sub: 'Statut : En cours',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
    },
    {
      title: 'Tâches non commencées',
      value: stats.notStartedTasks,
      sub: 'Statut : Non commencée',
      icon: ListTodo,
      color: 'text-slate-300',
      bg: 'bg-slate-800/80 border-slate-700',
    },
    {
      title: 'Tâches en retard',
      value: stats.overdueTasks,
      sub: 'Date limite dépassée',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Tableau de bord & Statistiques</h2>
          <p className="text-sm text-slate-400">
            Vue globale en temps réel des projets, des tâches et de leur avancement.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={exportReport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exporter Rapport (CSV)</span>
          </button>

          <button
            onClick={() => fetchStats(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex items-start justify-between hover:border-slate-700 transition shadow-lg"
            >
              <div>
                <p className="text-xs font-medium text-slate-400">{card.title}</p>
                <p className="text-3xl font-bold text-white mt-2 font-mono">{card.value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{card.sub}</p>
              </div>
              <div className={`p-3 rounded-xl border ${card.bg} ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Répartition des tâches par statut */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-semibold text-white mb-1">
            Répartition des Tâches par Statut
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Comparaison graphique entre les tâches non commencées, en cours, terminées et en retard.
          </p>

          <div className="space-y-4">
            {[
              {
                label: 'Non commencées',
                count: stats.notStartedTasks,
                color: 'bg-slate-500',
              },
              {
                label: 'En cours',
                count: stats.inProgressTasks,
                color: 'bg-amber-500',
              },
              {
                label: 'Terminées',
                count: stats.completedTasks,
                color: 'bg-emerald-500',
              },
              {
                label: 'En retard',
                count: stats.overdueTasks,
                color: 'bg-red-500',
              },
            ].map((bar, i) => {
              const pct =
                stats.totalTasks > 0 ? Math.round((bar.count / stats.totalTasks) * 100) : 0;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{bar.label}</span>
                    <span className="text-slate-400 font-mono">
                      {bar.count} tâche(s) ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${bar.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Taux d'avancement global (SVG Donut Chart) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg">
          <h3 className="text-base font-semibold text-white self-start mb-1">
            Taux d'Avancement Global
          </h3>
          <p className="text-xs text-slate-400 self-start mb-4">
            Pourcentage des tâches terminées sur la plateforme.
          </p>

          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#1e293b"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#10b981"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * completionRate) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white font-mono">{completionRate}%</span>
              <span className="text-[11px] text-emerald-400 font-medium">Terminées</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
