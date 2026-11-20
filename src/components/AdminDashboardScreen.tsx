import React from 'react';
import { FuncionarioDB } from '../lib/supabase.ts';
import { AdminPanel } from './AdminPanel.tsx';
import { RURALMED_LOGO_URL } from './Header.tsx';
import { LogOut, ShieldCheck } from 'lucide-react';

interface AdminDashboardScreenProps {
  admin: FuncionarioDB;
  onLogout: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  admin,
  onLogout,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col min-h-screen">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-sky-100">
        <div className="flex items-center gap-3">
          <img
            src={RURALMED_LOGO_URL}
            alt="RuralMed"
            className="h-[42px] w-auto object-contain rounded-lg"
          />
          <div className="border-l border-slate-200 pl-3">
            <span className="text-xs sm:text-sm font-bold text-sky-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Panel Administrativo</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-extrabold text-slate-900 leading-tight">
              {admin.nombre_completo}
            </p>
            <p className="text-xs text-slate-500">
              {admin.rol} · {admin.especialidad}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Mobile Admin Identity */}
      <div className="mt-4 mb-2 sm:hidden">
        <p className="text-base font-extrabold text-slate-900">{admin.nombre_completo}</p>
        <p className="text-xs text-slate-500">{admin.rol}</p>
      </div>

      {/* Main Admin Panel Content */}
      <div className="mt-5 flex-1">
        <AdminPanel />
      </div>
    </div>
  );
};
