// frontend/src/components/Logo.jsx
import React from 'react';
import { Zap } from 'lucide-react';

const Logo = ({ size = 'md', showSubtitle = true }) => {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-3 group select-none">
      {/* Badge Emblème Performance */}
      <div className="relative flex items-center justify-center shrink-0">
        {/* Lueur d'ambiance néon animée */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-sky-500 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse" />

        {/* Boîte principale de l'emblème */}
        <div
          className={`relative ${
            isLarge
              ? 'w-12 h-12 rounded-2xl'
              : isSmall
              ? 'w-8 h-8 rounded-lg'
              : 'w-10 h-10 rounded-xl'
          } bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-amber-500/40 flex items-center justify-center shadow-lg overflow-hidden`}
        >
          {/* Rayon de vitesse diagonal */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-transparent pointer-events-none" />

          {/* Icône principale : Éclair haute performance */}
          <Zap
            className={`${
              isLarge ? 'w-6 h-6' : isSmall ? 'w-4 h-4' : 'w-5 h-5'
            } text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)] transform group-hover:scale-110 group-hover:rotate-6 transition duration-300`}
          />

          {/* Point d'activité télémétrique en temps réel */}
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        </div>
      </div>

      {/* Textes de la marque */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-sm tracking-wider text-white">
            TASK<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-sky-400">FLOW</span>
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-widest font-semibold flex items-center gap-0.5 shadow-sm">
            ⚡ PERF
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-slate-400 font-medium tracking-tight flex items-center gap-1">
            <span>ISSAT KASSERINE</span>
            <span className="text-slate-600">•</span>
            <span className="text-sky-400/90">3 GLSI</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Logo;
