// frontend/src/pages/ActivityPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  History,
  CheckCircle2,
  PlusCircle,
  FileText,
  Paperclip,
  MessageSquare,
  ShieldAlert,
  FolderPlus,
  RefreshCw,
  Search,
} from 'lucide-react';

const ActivityPage = () => {
  const { socket } = useSocket();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activities');
      setActivities(res.data);
    } catch (err) {
      console.error('Erreur chargement journal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Écoute des nouvelles activités en direct via Socket.io (Section 1 & 7)
  useEffect(() => {
    if (!socket) return;
    const handleNewActivity = (newAct) => {
      setActivities((prev) => [newAct, ...prev]);
    };

    socket.on('activity:new', handleNewActivity);
    return () => socket.off('activity:new', handleNewActivity);
  }, [socket]);

  const getActionConfig = (action) => {
    switch (action) {
      case 'TASK_STATUS_CHANGED':
        return {
          label: 'Changement de statut',
          icon: CheckCircle2,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case 'TASK_CREATED':
        return {
          label: 'Création de tâche',
          icon: PlusCircle,
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        };
      case 'ATTACHMENT_ADDED':
        return {
          label: 'Pièce jointe ajoutée',
          icon: Paperclip,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        };
      case 'COMMENT_ADDED':
        return {
          label: 'Nouveau commentaire',
          icon: MessageSquare,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      case 'PROJECT_CREATED':
      case 'PROJECT_UPDATED':
        return {
          label: 'Projet',
          icon: FolderPlus,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        };
      case 'ROLE_UPDATED':
        return {
          label: 'Modification de rôle',
          icon: ShieldAlert,
          color: 'text-red-400 bg-red-500/10 border-red-500/30',
        };
      default:
        return {
          label: 'Action',
          icon: FileText,
          color: 'text-slate-400 bg-slate-800 border-slate-700',
        };
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      act.user?.name?.toLowerCase().includes(q) ||
      act.targetTitle?.toLowerCase().includes(q) ||
      act.details?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-sky-400" />
            <span>Journal d'Audit & Activités</span>
          </h2>
          <p className="text-sm text-slate-400">
            Traçabilité complète en temps réel de toutes les actions réalisées par l’équipe.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par utilisateur, tâche ou détail..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-sky-500 transition"
        />
      </div>

      {/* Liste chronologique d'activités */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Chargement du journal d'activités...</span>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
          Aucune activité enregistrée pour le moment.
        </div>
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl divide-y divide-slate-800/80">
          {filteredActivities.map((act) => {
            const config = getActionConfig(act.action);
            const Icon = config.icon;

            return (
              <div key={act._id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                <div className={`p-2.5 rounded-xl border shrink-0 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">
                        {act.user?.name || 'Utilisateur'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {act.user?.role || 'Employé'}
                      </span>
                      <span className="text-xs text-slate-400">• {config.label} :</span>
                      <span className="text-xs font-semibold text-sky-400">
                        {act.targetTitle}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {act.details && (
                    <p className="text-xs text-slate-300 leading-relaxed pl-1">
                      {act.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
