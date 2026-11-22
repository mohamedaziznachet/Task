// frontend/src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showSuccess = useCallback((message) => addToast(message, 'success'), [addToast]);
  const showError = useCallback((message) => addToast(message, 'error'), [addToast]);
  const showInfo = useCallback((message) => addToast(message, 'info'), [addToast]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}

      {/* Rendu des Toasts en haut à droite */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                isSuccess
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200 shadow-emerald-500/10'
                  : isError
                  ? 'bg-red-950/80 border-red-500/40 text-red-200 shadow-red-500/10'
                  : 'bg-slate-900/90 border-slate-700 text-slate-200 shadow-sky-500/10'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
                <p className="text-xs font-medium leading-relaxed">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
