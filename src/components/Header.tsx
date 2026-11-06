import React from 'react';
import { HeartPulse, PhoneCall, Type } from 'lucide-react';

interface HeaderProps {
  fontSize: 'normal' | 'large' | 'xl';
  setFontSize: (size: 'normal' | 'large' | 'xl') => void;
  onOpenEmergency: () => void;
  currentScreen?: 'login' | 'register' | 'dashboard';
  userName?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fontSize,
  setFontSize,
  onOpenEmergency,
  currentScreen = 'login',
  userName,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/15">
            <HeartPulse className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 block leading-tight">
              Rural<span className="text-emerald-600">Med</span>
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 hidden sm:block">
              Salud Conectada para Zonas Rurales
            </span>
          </div>
        </div>

        {/* Center / Accessibility Controls: Text Size Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1 px-1.5 text-slate-500 text-xs font-semibold">
            <Type className="w-4 h-4 hidden sm:inline" />
            <span className="hidden md:inline">Letra:</span>
          </div>
          <button
            type="button"
            onClick={() => setFontSize('normal')}
            aria-label="Tamaño de letra normal"
            className={`min-h-[38px] px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              fontSize === 'normal'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setFontSize('large')}
            aria-label="Tamaño de letra grande"
            className={`min-h-[38px] px-2.5 py-1 text-sm font-bold rounded-lg transition-all ${
              fontSize === 'large'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A+
          </button>
          <button
            type="button"
            onClick={() => setFontSize('xl')}
            aria-label="Tamaño de letra extra grande"
            className={`min-h-[38px] px-3 py-1 text-base font-bold rounded-lg transition-all ${
              fontSize === 'xl'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A++
          </button>
        </div>

        {/* Action Zone: Emergency & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenEmergency}
            className="min-h-[44px] px-3 sm:px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors"
            title="Líneas de urgencia médica rural"
          >
            <PhoneCall className="w-4 h-4 text-rose-600 animate-pulse" />
            <span className="hidden sm:inline">Urgencias</span>
            <span className="font-bold sm:hidden">131</span>
          </button>

          {currentScreen === 'dashboard' && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[44px] px-3 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-colors"
            >
              Cerrar Sesión
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
