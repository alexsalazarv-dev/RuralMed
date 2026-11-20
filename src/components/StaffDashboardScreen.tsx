import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FuncionarioDB, CitaDB, EstadoCita } from '../lib/supabase.ts';
import {
  fetchAllCitasWithRelations,
  fetchActiveFuncionarios,
  updateCitaEstadoInSupabase,
  calculateStatsForRange,
  toISODateLocal,
} from '../lib/appointmentsService.ts';
import { RURALMED_LOGO_URL } from './Header.tsx';
import {
  LogOut,
  Calendar,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  User,
  Stethoscope,
  Filter,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';

interface StaffDashboardScreenProps {
  funcionario: FuncionarioDB;
  onLogout: () => void;
}

function CircularGauge({
  percentage,
  label,
  sublabel,
  accentClass = 'text-sky-600',
}: {
  percentage: number;
  label: string;
  sublabel: string;
  accentClass?: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200 flex items-center gap-5 shadow-xs">
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-sky-100"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${accentClass} transition-all duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-extrabold text-slate-900 tabular-nums">{clamped}%</span>
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">{label}</h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 tabular-nums">{sublabel}</p>
      </div>
    </div>
  );
}

export const StaffDashboardScreen: React.FC<StaffDashboardScreenProps> = ({
  funcionario,
  onLogout,
}) => {
  const todayStr = toISODateLocal(new Date());
  const isAdmin = funcionario.rol === 'Administrativo';

  const [activeTab, setActiveTab] = useState<'agenda' | 'reportes'>('agenda');
  const [allCitas, setAllCitas] = useState<CitaDB[]>([]);
  const [funcionariosActivos, setFuncionariosActivos] = useState<FuncionarioDB[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters for Agenda
  const [agendaDate, setAgendaDate] = useState<string>(todayStr);
  const [showAllDates, setShowAllDates] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'Todas' | EstadoCita>('Todas');
  const [selectedFuncFilter, setSelectedFuncFilter] = useState<string>(
    isAdmin ? 'todos' : String(funcionario.funcionario_id)
  );
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Filters for Reportes y Estadísticas
  const [reportMode, setReportMode] = useState<'dia' | 'rango'>('dia');
  const [reportStartDate, setReportStartDate] = useState<string>(todayStr);
  const [reportEndDate, setReportEndDate] = useState<string>(todayStr);

  const loadFromSupabase = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [citasRes, funcRes] = await Promise.all([
        fetchAllCitasWithRelations(),
        fetchActiveFuncionarios(),
      ]);

      if (citasRes.error) setErrorMsg(citasRes.error);
      if (funcRes.error) setErrorMsg(funcRes.error);

      setAllCitas(citasRes.data);
      setFuncionariosActivos(funcRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  const filteredAgendaCitas = useMemo(() => {
    return allCitas.filter((c) => {
      if (!isAdmin) {
        if (c.funcionario_id !== funcionario.funcionario_id) return false;
      } else if (
        selectedFuncFilter !== 'todos' &&
        c.funcionario_id !== Number(selectedFuncFilter)
      ) {
        return false;
      }
      if (!showAllDates && agendaDate && c.fecha !== agendaDate) return false;
      if (statusFilter !== 'Todas' && c.estado !== statusFilter) return false;
      return true;
    });
  }, [allCitas, isAdmin, funcionario.funcionario_id, selectedFuncFilter, showAllDates, agendaDate, statusFilter]);

  const effectiveEndDate =
    reportMode === 'dia'
      ? reportStartDate
      : reportEndDate >= reportStartDate
      ? reportEndDate
      : reportStartDate;

  const stats = useMemo(() => {
    const funcScope = !isAdmin
      ? funcionario.funcionario_id
      : selectedFuncFilter !== 'todos'
      ? Number(selectedFuncFilter)
      : undefined;

    return calculateStatsForRange(
      allCitas,
      funcionariosActivos,
      reportStartDate,
      effectiveEndDate,
      funcScope
    );
  }, [allCitas, funcionariosActivos, reportStartDate, effectiveEndDate, isAdmin, funcionario.funcionario_id, selectedFuncFilter]);

  const handleStatusChange = async (citaId: number, nuevoEstado: EstadoCita) => {
    setUpdatingId(citaId);
    setErrorMsg(null);
    try {
      const res = await updateCitaEstadoInSupabase(citaId, nuevoEstado);
      if (!res.success) {
        setErrorMsg(`Error al actualizar estado en Supabase: ${res.error}`);
        return;
      }
      setConfirmCancelId(null);
      await loadFromSupabase();
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (estado: EstadoCita) => {
    switch (estado) {
      case 'Confirmada':
        return 'bg-sky-100 text-sky-900 border border-sky-200';
      case 'En Espera':
        return 'bg-amber-100 text-amber-900 border border-amber-200';
      case 'Atendida':
        return 'bg-cyan-100 text-cyan-900 border border-cyan-200';
      case 'Cancelada':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col min-h-screen">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-sky-100">
        <div className="flex items-center gap-3">
          <img
            src={RURALMED_LOGO_URL}
            alt="RuralMed"
            className="h-[40px] w-auto object-contain rounded-lg"
          />
          <div className="border-l border-slate-200 pl-3">
            <span className="text-xs sm:text-sm font-bold text-sky-700 block">
              Panel de Equipo de Salud
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-extrabold text-slate-900 leading-tight">
              {funcionario.nombre_completo}
            </p>
            <p className="text-xs text-slate-500">
              {funcionario.rol} · {funcionario.especialidad}
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

      {/* Mobile identity */}
      <div className="mt-5 mb-4 sm:hidden">
        <p className="text-base font-extrabold text-slate-900">{funcionario.nombre_completo}</p>
        <p className="text-xs text-slate-500">{funcionario.especialidad}</p>
      </div>

      {/* Main Section Tabs + Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 sm:mt-6 mb-6">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`flex-1 sm:flex-initial min-h-[44px] px-5 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'agenda'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>Agenda de Citas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reportes')}
            className={`flex-1 sm:flex-initial min-h-[44px] px-5 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reportes'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Reportes y Estadísticas</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadFromSupabase}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar desde Supabase</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: AGENDA DE CITAS */}
      {activeTab === 'agenda' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Filter className="w-4 h-4 text-sky-600" />
              <span>Filtros de Agenda</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha</label>
                <input
                  type="date"
                  disabled={showAllDates}
                  value={agendaDate}
                  onChange={(e) => setAgendaDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-white disabled:opacity-50"
                />
                <label className="mt-1.5 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAllDates}
                    onChange={(e) => setShowAllDates(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Mostrar todas las fechas</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Estado de la Cita</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'Todas' | EstadoCita)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-white"
                >
                  <option value="Todas">Todos los estados</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="En Espera">En Espera</option>
                  <option value="Atendida">Atendida</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              {isAdmin && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Profesional de la Posta
                  </label>
                  <select
                    value={selectedFuncFilter}
                    onChange={(e) => setSelectedFuncFilter(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-white"
                  >
                    <option value="todos">Todos los profesionales ({funcionariosActivos.length})</option>
                    {funcionariosActivos.map((p) => (
                      <option key={p.funcionario_id} value={String(p.funcionario_id)}>
                        {p.nombre_completo} — {p.especialidad}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-extrabold text-slate-900">
                Pacientes Agendados ({filteredAgendaCitas.length})
              </h2>
              {!showAllDates && (
                <span className="text-xs font-semibold text-sky-700 tabular-nums">
                  Jornada: {agendaDate}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-500 text-sm font-semibold">
                Cargando citas desde Supabase...
              </div>
            ) : filteredAgendaCitas.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-500">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No hay citas registradas para este filtro</p>
                <p className="text-xs mt-1">
                  Cuando los pacientes reserven horas aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              filteredAgendaCitas.map((cita) => {
                const isActive = cita.estado === 'Confirmada' || cita.estado === 'En Espera';

                return (
                  <div
                    key={cita.cita_id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-sky-800 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200 tabular-nums">
                          <Clock className="w-4 h-4 text-sky-600" />
                          {cita.fecha} · {cita.hora}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getStatusStyle(
                            cita.estado
                          )}`}
                        >
                          {cita.estado}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{cita.paciente_nombre}</span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600 mt-1">
                          {cita.usuarios?.rut && (
                            <span className="tabular-nums">
                              RUT: <strong className="text-slate-800">{cita.usuarios.rut}</strong>
                            </span>
                          )}
                          {cita.usuarios?.celular && (
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Phone className="w-3.5 h-3.5 text-sky-600" />
                              <strong>{cita.usuarios.celular}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                        <span className="font-bold text-slate-800">{cita.tipo_atencion}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-sky-800 font-semibold">
                          <Stethoscope className="w-3.5 h-3.5" />
                          {cita.funcionarios?.nombre_completo || `Profesional #${cita.funcionario_id}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                      {isActive ? (
                        confirmCancelId === cita.cita_id ? (
                          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-900">¿Cancelar y liberar cupo?</span>
                            <button
                              type="button"
                              disabled={updatingId === cita.cita_id}
                              onClick={() => handleStatusChange(cita.cita_id, 'Cancelada')}
                              className="min-h-[38px] px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(null)}
                              className="min-h-[38px] px-3 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={updatingId === cita.cita_id}
                              onClick={() => handleStatusChange(cita.cita_id, 'Atendida')}
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Marcar Atendida</span>
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === cita.cita_id}
                              onClick={() => setConfirmCancelId(cita.cita_id)}
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Cancelar Cita</span>
                            </button>
                          </>
                        )
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          {cita.estado === 'Atendida'
                            ? 'Consulta finalizada'
                            : 'Cupo liberado en agenda'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REPORTES Y ESTADÍSTICAS */}
      {activeTab === 'reportes' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Reportes y Estadísticas</h2>
                <p className="text-xs text-slate-500">
                  Métricas calculadas en tiempo real desde la tabla citas de Supabase
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setReportMode('dia');
                    setReportEndDate(reportStartDate);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    reportMode === 'dia'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Día específico
                </button>
                <button
                  type="button"
                  onClick={() => setReportMode('rango')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    reportMode === 'rango'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rango de fechas
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {reportMode === 'dia' ? 'Fecha de la jornada' : 'Desde'}
                </label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => {
                    setReportStartDate(e.target.value);
                    if (reportMode === 'dia' || e.target.value > reportEndDate) {
                      setReportEndDate(e.target.value);
                    }
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-white"
                />
              </div>

              {reportMode === 'rango' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    min={reportStartDate}
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-white"
                  />
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Profesional</label>
                  <select
                    value={selectedFuncFilter}
                    onChange={(e) => setSelectedFuncFilter(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-white"
                  >
                    <option value="todos">Toda la Posta</option>
                    {funcionariosActivos.map((p) => (
                      <option key={p.funcionario_id} value={String(p.funcionario_id)}>
                        {p.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">Total Citas Agendadas</span>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tabular-nums">
                {stats.totalAgendadas}
              </p>
              <span className="text-xs text-sky-700 font-semibold mt-1 block">
                {stats.totalPendientes} activas pendientes
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-sky-50/70 border border-sky-200 shadow-xs">
              <span className="text-xs font-bold text-sky-800 block">Total Citas Atendidas</span>
              <p className="text-3xl sm:text-4xl font-extrabold text-sky-900 mt-2 tabular-nums">
                {stats.totalAtendidas}
              </p>
              <span className="text-xs text-sky-700 font-semibold mt-1 block">
                Consultas completadas
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-rose-50/60 border border-rose-200 shadow-xs">
              <span className="text-xs font-bold text-rose-800 block">Total Citas Canceladas</span>
              <p className="text-3xl sm:text-4xl font-extrabold text-rose-800 mt-2 tabular-nums">
                {stats.totalCanceladas}
              </p>
              <span className="text-xs text-rose-700 font-semibold mt-1 block">
                Cupos liberados
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-cyan-50/70 border border-cyan-200 shadow-xs">
              <span className="text-xs font-bold text-cyan-800 block">Total Cupos Libres</span>
              <p className="text-3xl sm:text-4xl font-extrabold text-cyan-900 mt-2 tabular-nums">
                {stats.cuposLibres}
              </p>
              <span className="text-xs text-cyan-700 font-semibold mt-1 block tabular-nums">
                De {stats.cuposTotales} cupos totales
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CircularGauge
              percentage={stats.porcentajeAsistencia}
              label="Porcentaje de Asistencia"
              sublabel={`${stats.totalAtendidas} atendidas de ${stats.totalAgendadas} citas agendadas`}
              accentClass="text-sky-600"
            />

            <CircularGauge
              percentage={stats.porcentajeOcupacion}
              label="Porcentaje de Ocupación Diaria"
              sublabel={`${stats.cuposTomados} cupos ocupados de ${stats.cuposTotales} cupos totales`}
              accentClass="text-cyan-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};
