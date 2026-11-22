// frontend/src/components/GanttView.jsx
import React from 'react';
import { GanttChartSquare, Calendar, CheckCircle2, Clock, CircleDashed } from 'lucide-react';

const GanttView = ({ projects = [], tasks = [], onSelectTask }) => {
  // Calculer l'intervalle global (date minimale et date maximale)
  let minDate = new Date();
  let maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (projects.length > 0) {
    const startDates = projects.map((p) => new Date(p.startDate).getTime());
    const endDates = projects.map((p) => new Date(p.endDate).getTime());
    minDate = new Date(Math.min(...startDates));
    maxDate = new Date(Math.max(...endDates));
  }

  const totalDuration = maxDate.getTime() - minDate.getTime() || 1;

  // Calcul du pourcentage de position sur l'axe temporel
  const getPositionPercent = (date) => {
    const time = new Date(date).getTime();
    const pct = ((time - minDate.getTime()) / totalDuration) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Terminé':
      case 'Terminée':
        return 'bg-emerald-500 text-white border-emerald-400';
      case 'En cours':
        return 'bg-amber-500 text-white border-amber-400';
      default:
        return 'bg-slate-600 text-slate-200 border-slate-500';
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <GanttChartSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Chronologie & Diagramme de Gantt</h3>
            <p className="text-xs text-slate-400">
              Visualisation temporelle des projets et des jalons des tâches associées
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>{minDate.toLocaleDateString()}</span>
          <span>➜</span>
          <span>{maxDate.toLocaleDateString()}</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Aucun projet à afficher dans la frise chronologique.
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((proj) => {
            const projStartPct = getPositionPercent(proj.startDate);
            const projEndPct = getPositionPercent(proj.endDate);
            const projWidthPct = Math.max(4, projEndPct - projStartPct);

            const projTasks = tasks.filter(
              (t) => (t.project?._id || t.project) === proj._id
            );

            return (
              <div
                key={proj._id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3"
              >
                {/* Barre du Projet */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{proj.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(
                        proj.status
                      )}`}
                    >
                      {proj.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(proj.startDate).toLocaleDateString()} -{' '}
                    {new Date(proj.endDate).toLocaleDateString()} ({projTasks.length} tâches)
                  </div>
                </div>

                {/* Axe temporel du projet */}
                <div className="relative h-6 bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                  <div
                    className="absolute top-1 bottom-1 rounded-md bg-gradient-to-r from-sky-500/30 to-indigo-500/40 border border-sky-400/50 flex items-center px-2"
                    style={{ left: `${projStartPct}%`, width: `${projWidthPct}%` }}
                  >
                    <span className="text-[9px] font-mono text-sky-200 truncate">
                      Durée du Projet
                    </span>
                  </div>
                </div>

                {/* Tâches associées sous forme de barres Gantt */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  {projTasks.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic pl-2">
                      Aucune tâche enregistrée sur ce projet
                    </div>
                  ) : (
                    projTasks.map((task) => {
                      const taskDuePct = getPositionPercent(task.dueDate);
                      // On estime le début au projet start si non renseigné
                      const taskStartPct = Math.max(projStartPct, taskDuePct - 15);
                      const taskWidth = Math.max(5, taskDuePct - taskStartPct);

                      return (
                        <div
                          key={task._id}
                          onClick={() => onSelectTask && onSelectTask(task)}
                          className="group flex items-center gap-3 cursor-pointer py-1"
                        >
                          <div className="w-40 shrink-0 text-xs text-slate-300 truncate group-hover:text-sky-300 transition">
                            {task.title}
                          </div>

                          <div className="relative flex-1 h-5 bg-slate-900/60 rounded-md border border-slate-800/60">
                            <div
                              className={`absolute top-0.5 bottom-0.5 rounded flex items-center px-2 border text-[9px] font-semibold truncate transition-all duration-300 group-hover:brightness-125 ${getStatusColor(
                                task.status
                              )}`}
                              style={{ left: `${taskStartPct}%`, width: `${taskWidth}%` }}
                              title={`${task.title} - Échéance: ${new Date(
                                task.dueDate
                              ).toLocaleDateString()}`}
                            >
                              <span className="truncate">{task.title}</span>
                            </div>
                          </div>

                          <div className="w-24 shrink-0 text-right text-[10px] font-mono text-slate-400">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })
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

export default GanttView;
