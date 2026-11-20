import React from 'react';
import { PhoneCall, Type } from 'lucide-react';

export const RURALMED_LOGO_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-19_at_16.34.43_905d55ab.jpeg';

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
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src={RURALMED_LOGO_URL}
            alt="RuralMed"
            className="h-[40px] w-auto object-contain rounded-lg"
          />
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
            className={`min-h-[38px] px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              fontSize === 'normal'
                ? 'bg-white text-sky-700 shadow-xs ring-1 ring-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setFontSize('large')}
            aria-label="Tamaño de letra grande"
            className={`min-h-[38px] px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              fontSize === 'large'
                ? 'bg-white text-sky-700 shadow-xs ring-1 ring-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A+
          </button>
          <button
            type="button"
            onClick={() => setFontSize('xl')}
            aria-label="Tamaño de letra extra grande"
            className={`min-h-[38px] px-3 py-1 text-base font-bold rounded-lg transition-all cursor-pointer ${
              fontSize === 'xl'
                ? 'bg-white text-sky-700 shadow-xs ring-1 ring-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A++
          </button>
        </div>

        {/* Action Zone: Emergency & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenEmergency}
            className="min-h-[44px] px-3 sm:px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            title="Líneas de urgencia médica rural"
          >
            <PhoneCall className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">Urgencias</span>
            <span className="font-bold sm:hidden">131</span>
          </button>

          {currentScreen === 'dashboard' && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[44px] px-3 sm:px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
