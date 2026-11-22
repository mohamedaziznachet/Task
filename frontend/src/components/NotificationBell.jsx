// frontend/src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCheck, Sparkles, X } from 'lucide-react';

const NotificationBell = () => {
  const { notifications, unreadCount, clearNotifications, markAsRead, connected } = useSocket();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 transition"
        title="Notifications en temps réel"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* En-tête */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Notifications en direct</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'
                }`}
                title={connected ? 'Connecté à Socket.io (Temps Réel)' : 'Déconnecté'}
              />
            </div>

            {unreadCount > 0 && (
              <button
                onClick={clearNotifications}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tout effacer</span>
              </button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Sparkles className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="font-medium text-slate-300">Aucune nouvelle notification</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Les affectations et mises à jour apparaîtront ici instantanément.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 hover:bg-slate-800/40 transition flex items-start justify-between gap-2.5 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-white">
                      {n.from}
                    </p>
                    <p className="text-slate-300 leading-snug">{n.details || n.targetTitle}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <button
                    onClick={() => markAsRead(n.id)}
                    className="text-slate-500 hover:text-slate-300 p-1"
                    title="Marquer comme lu"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
