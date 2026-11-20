import React, { useState, useMemo, useEffect } from 'react';
import { Funcionario, PROFESIONALES } from '../lib/clinicData.ts';
import {
  CitaMedica,
  EstadoCita,
  loadAllCitas,
  updateAppointmentStatus,
  calculateStatsForRange,
  toISODateLocal,
} from '../lib/appointmentsService.ts';
import {
  HeartPulse,
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
} from 'lucide-react';

interface StaffDashboardScreenProps {
  funcionario: Funcionario;
  onLogout: () => void;
}

function CircularGauge({
  percentage,
  label,
  sublabel,
  accentClass = 'text-emerald-600',
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
            className="text-emerald-100"
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
  const [activeTab, setActiveTab] = useState<'agenda' | 'reportes'>('agenda');
  const [allCitas, setAllCitas] = useState<CitaMedica[]>(() => loadAllCitas());

  // Filters for Agenda
  const [agendaDate, setAgendaDate] = useState<string>(todayStr);
  const [showAllDates, setShowAllDates] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'Todas' | EstadoCita>('Todas');
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>(
    funcionario.rol === 'doctor' && funcionario.profesionalId ? funcionario.profesionalId : 'todos'
  );
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Filters for Reportes y Estadísticas
  const [reportMode, setReportMode] = useState<'dia' | 'rango'>('dia');
  const [reportStartDate, setReportStartDate] = useState<string>(todayStr);
  const [reportEndDate, setReportEndDate] = useState<string>(todayStr);

  useEffect(() => {
    const sync = () => setAllCitas(loadAllCitas());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Scoped appointments for Agenda tab
  const filteredAgendaCitas = useMemo(() => {
    return allCitas
      .filter((c) => {
        if (funcionario.rol === 'doctor' && funcionario.profesionalId) {
          if (c.profesionalId !== funcionario.profesionalId) return false;
        } else if (selectedProfFilter !== 'todos' && c.profesionalId !== selectedProfFilter) {
          return false;
        }
        if (!showAllDates && agendaDate && c.fecha !== agendaDate) return false;
        if (statusFilter !== 'Todas' && c.estado !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  }, [allCitas, funcionario, selectedProfFilter, showAllDates, agendaDate, statusFilter]);

  // Real-time stats for Reportes y Estadísticas tab
  const effectiveEndDate =
    reportMode === 'dia'
      ? reportStartDate
      : reportEndDate >= reportStartDate
      ? reportEndDate
      : reportStartDate;

  const stats = useMemo(() => {
    const profScope =
      funcionario.rol === 'doctor' && funcionario.profesionalId
        ? funcionario.profesionalId
        : selectedProfFilter !== 'todos'
        ? selectedProfFilter
        : undefined;

    return calculateStatsForRange(allCitas, reportStartDate, effectiveEndDate, profScope);
  }, [allCitas, reportStartDate, effectiveEndDate, funcionario, selectedProfFilter]);

  const handleStatusChange = async (citaId: string, nuevoEstado: EstadoCita) => {
    const updated = await updateAppointmentStatus(citaId, nuevoEstado);
    setAllCitas(updated);
    setConfirmCancelId(null);
  };

  const getStatusStyle = (estado: EstadoCita) => {
    switch (estado) {
      case 'Confirmada':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
      case 'En Espera':
        return 'bg-amber-100 text-amber-900 border border-amber-200';
      case 'Atendida':
        return 'bg-teal-100 text-teal-900 border border-teal-200';
      case 'Cancelada':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col min-h-screen">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <HeartPulse className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
              Rural<span className="text-emerald-600">Med</span>
            </span>
            <span className="text-xs font-semibold text-emerald-700 block">
              Panel de Equipo de Salud
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-extrabold text-slate-900 leading-tight">{funcionario.nombre}</p>
            <p className="text-xs text-slate-500">
              {funcionario.cargo} · {funcionario.posta}
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

      {/* Staff Greeting (mobile visible) */}
      <div className="mt-5 mb-4 sm:hidden">
        <p className="text-base font-extrabold text-slate-900">{funcionario.nombre}</p>
        <p className="text-xs text-slate-500">{funcionario.cargo}</p>
      </div>

      {/* Main Section Tabs */}
      <div className="flex items-center gap-2 mt-4 sm:mt-6 mb-6 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`flex-1 sm:flex-initial min-h-[44px] px-5 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'agenda'
              ? 'bg-emerald-600 text-white shadow-sm'
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
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>Reportes y Estadísticas</span>
        </button>
      </div>

      {/* TAB 1: AGENDA DE CITAS */}
      {activeTab === 'agenda' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Filters Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Filtros de Agenda</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Fecha */}
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
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Mostrar todas las fechas</span>
                </label>
              </div>

              {/* Estado */}
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

              {/* Profesional (visible para Administrador) */}
              {funcionario.rol === 'admin' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Profesional de la Posta
                  </label>
                  <select
                    value={selectedProfFilter}
                    onChange={(e) => setSelectedProfFilter(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-white"
                  >
                    <option value="todos">Todos los profesionales ({PROFESIONALES.length})</option>
                    {PROFESIONALES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — {p.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Appointments List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-extrabold text-slate-900">
                Pacientes Agendados ({filteredAgendaCitas.length})
              </h2>
              {!showAllDates && (
                <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                  Jornada: {agendaDate}
                </span>
              )}
            </div>

            {filteredAgendaCitas.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-500">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No hay citas registradas para este filtro</p>
                <p className="text-xs mt-1">
                  Pruebe seleccionando otra fecha o activando &quot;Mostrar todas las fechas&quot;.
                </p>
              </div>
            ) : (
              filteredAgendaCitas.map((cita) => {
                const isActive = cita.estado === 'Confirmada' || cita.estado === 'En Espera';

                return (
                  <div
                    key={cita.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 tabular-nums">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          {cita.fecha} · {cita.hora} hrs
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
                          <span>{cita.pacienteNombre}</span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600 mt-1">
                          <span className="tabular-nums">
                            RUT: <strong className="text-slate-800">{cita.pacienteRut}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <strong>{cita.pacienteTelefono}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                        <span className="font-bold text-slate-800">{cita.especialidad}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                          <Stethoscope className="w-3.5 h-3.5" />
                          {cita.profesionalNombre}
                        </span>
                      </div>
                    </div>

                    {/* Staff Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                      {isActive ? (
                        confirmCancelId === cita.id ? (
                          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-900">¿Cancelar y liberar cupo?</span>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(cita.id, 'Cancelada')}
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
                              onClick={() => handleStatusChange(cita.id, 'Atendida')}
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Marcar Atendida</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(cita.id)}
                              className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
          {/* Date Filter Controls */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Reportes y Estadísticas</h2>
                <p className="text-xs text-slate-500">
                  Métricas calculadas en tiempo real desde la base de datos de citas
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
                      ? 'bg-emerald-600 text-white'
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
                      ? 'bg-emerald-600 text-white'
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

              {funcionario.rol === 'admin' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Profesional</label>
                  <select
                    value={selectedProfFilter}
                    onChange={(e) => setSelectedProfFilter(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-white"
                  >
                    <option value="todos">Toda la Posta</option>
                    {PROFESIONALES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 4 KPI Counter Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block">Total Citas Agendadas</span>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tabular-nums">
                {stats.totalAgendadas}
              </p>
              <span className="text-xs text-emerald-700 font-semibold mt-1 block">
                {stats.totalPendientes} activas pendientes
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
              <span className="text-xs font-bold text-emerald-800 block">Total Citas Atendidas</span>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-900 mt-2 tabular-nums">
                {stats.totalAtendidas}
              </p>
              <span className="text-xs text-emerald-700 font-semibold mt-1 block">
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

            <div className="p-5 rounded-3xl bg-teal-50/70 border border-teal-200 shadow-xs">
              <span className="text-xs font-bold text-teal-800 block">Total Cupos Libres</span>
              <p className="text-3xl sm:text-4xl font-extrabold text-teal-900 mt-2 tabular-nums">
                {stats.cuposLibres}
              </p>
              <span className="text-xs text-teal-700 font-semibold mt-1 block tabular-nums">
                De {stats.cuposTotales} cupos totales
              </span>
            </div>
          </div>

          {/* Visual Gauges: Asistencia & Ocupación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CircularGauge
              percentage={stats.porcentajeAsistencia}
              label="Porcentaje de Asistencia"
              sublabel={`${stats.totalAtendidas} atendidas de ${stats.totalAgendadas} citas agendadas`}
              accentClass="text-emerald-600"
            />

            <CircularGauge
              percentage={stats.porcentajeOcupacion}
              label="Porcentaje de Ocupación Diaria"
              sublabel={`${stats.cuposTomados} cupos ocupados de ${stats.cuposTotales} cupos totales`}
              accentClass="text-teal-600"
            />
          </div>

          {/* Horizontal Breakdown Bar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Distribución de la Jornada
            </h3>

            <div className="space-y-3">
              {[
                {
                  label: 'Atendidas',
                  count: stats.totalAtendidas,
                  total: Math.max(1, stats.totalAgendadas),
                  barClass: 'bg-emerald-600',
                },
                {
                  label: 'Pendientes (Confirmadas / En Espera)',
                  count: stats.totalPendientes,
                  total: Math.max(1, stats.totalAgendadas),
                  barClass: 'bg-teal-500',
                },
                {
                  label: 'Canceladas',
                  count: stats.totalCanceladas,
                  total: Math.max(1, stats.totalAgendadas),
                  barClass: 'bg-rose-400',
                },
                {
                  label: 'Cupos Libres',
                  count: stats.cuposLibres,
                  total: Math.max(1, stats.cuposTotales),
                  barClass: 'bg-emerald-300',
                },
              ].map((row) => {
                const pct = Math.round((row.count / row.total) * 100);
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{row.label}</span>
                      <span className="tabular-nums">
                        {row.count} ({stats.totalAgendadas === 0 && row.label !== 'Cupos Libres' ? 0 : pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.barClass} transition-all duration-500`}
                        style={{
                          width: `${
                            stats.totalAgendadas === 0 && row.label !== 'Cupos Libres' ? 0 : pct
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
