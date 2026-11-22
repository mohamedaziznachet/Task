// frontend/src/components/CalendarView.jsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CalendarView = ({ tasks = [], onSelectTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Calcul du premier jour du mois (0 = Dimanche, transformé pour Lun = 0)
  const firstDayOfMonth = new Date(year, month, 1);
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay === -1) startingDay = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Regroupement des tâches par date (YYYY-MM-DD)
  const tasksByDate = {};
  tasks.forEach((task) => {
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
      tasksByDate[dateKey].push(task);
    }
  });

  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === year && today.getMonth() === month;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Haute':
        return 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30';
      case 'Moyenne':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Barre d'en-tête du calendrier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-mono">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-slate-400">Vue mensuelle des échéances de tâches</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            Aujourd'hui
          </button>
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center py-2 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[100px] rounded-xl bg-slate-950/20 border border-slate-900/40 p-2 opacity-30"
              />
            );
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
            2,
            '0'
          )}`;
          const dayTasks = tasksByDate[dateKey] || [];
          const isToday = isCurrentMonthToday && today.getDate() === day;

          return (
            <div
              key={`day-${day}`}
              className={`min-h-[105px] rounded-xl border p-2 flex flex-col justify-between transition ${
                isToday
                  ? 'bg-sky-500/5 border-sky-500/50 shadow-md shadow-sky-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-mono font-bold ${
                    isToday
                      ? 'w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center'
                      : 'text-slate-300'
                  }`}
                >
                  {day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {dayTasks.length} {dayTasks.length > 1 ? 'tâches' : 'tâche'}
                  </span>
                )}
              </div>

              {/* Tâches du jour */}
              <div className="space-y-1 overflow-y-auto max-h-24">
                {dayTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => onSelectTask && onSelectTask(task)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium border truncate cursor-pointer transition ${getPriorityColor(
                      task.priority
                    )}`}
                    title={`${task.title} - ${task.status} (${task.priority})`}
                  >
                    <div className="font-semibold truncate">{task.title}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
