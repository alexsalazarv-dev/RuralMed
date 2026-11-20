import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Usuario, FuncionarioDB, CitaDB, EstadoCita } from '../lib/supabase.ts';
import {
  TIPOS_ATENCION_BASE,
  HORARIOS_POSTA,
  LUGAR_POSTA_DEFAULT,
  getIndicacionesPorEspecialidad,
  getBoxPorRol,
} from '../lib/clinicData.ts';
import {
  fetchActiveFuncionarios,
  fetchOccupiedCitas,
  fetchCitasByUsuario,
  bookAppointmentInSupabase,
  updateCitaEstadoInSupabase,
  isSlotOccupied,
  getDayAvailability,
  toISODateLocal,
  formatFechaHumana,
} from '../lib/appointmentsService.ts';
import { AvailabilityCalendar } from './AvailabilityCalendar.tsx';
import { RURALMED_LOGO_URL } from './Header.tsx';
import {
  Calendar,
  ClipboardList,
  Users,
  FileSignature,
  User as UserIcon,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  CalendarPlus,
  Building2,
  X,
  PhoneCall,
  Plus,
  ChevronRight,
  Stethoscope,
  Clock,
  AlertCircle,
  Info,
  RefreshCw,
} from 'lucide-react';

interface DashboardScreenProps {
  usuario: Usuario;
  onLogout: () => void;
  onOpenEmergency: () => void;
  fontSize: 'normal' | 'large' | 'xl';
  setFontSize: (size: 'normal' | 'large' | 'xl') => void;
}

interface CargaFamiliar {
  id: string;
  nombre: string;
  rut: string;
  parentesco: string;
  edad: number;
}

function getEstadoBadgeStyle(estado: EstadoCita): string {
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
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  usuario,
  onLogout,
  onOpenEmergency,
  fontSize,
  setFontSize,
}) => {
  const [activeView, setActiveView] = useState<'home' | 'reservar' | 'mis-citas' | 'cargas' | 'derivaciones'>('home');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Real-time Supabase data states
  const [funcionariosActivos, setFuncionariosActivos] = useState<FuncionarioDB[]>([]);
  const [occupiedCitas, setOccupiedCitas] = useState<CitaDB[]>([]);
  const [misCitas, setMisCitas] = useState<CitaDB[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Detail modal state for "Mis Citas Médicas"
  const [selectedCita, setSelectedCita] = useState<CitaDB | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Cargas Familiares (session list so caregiver can book for family)
  const [cargas, setCargas] = useState<CargaFamiliar[]>([]);
  const [showAddCargaModal, setShowAddCargaModal] = useState(false);
  const [newCargaNombre, setNewCargaNombre] = useState('');
  const [newCargaRut, setNewCargaRut] = useState('');
  const [newCargaParentesco, setNewCargaParentesco] = useState('Padre / Madre');
  const [newCargaEdad, setNewCargaEdad] = useState('65');

  // Booking form state
  const [bookingPara, setBookingPara] = useState<string>('titular');
  const [bookingEspecialidad, setBookingEspecialidad] = useState<string>(TIPOS_ATENCION_BASE[0]);
  const [bookingFuncionarioId, setBookingFuncionarioId] = useState<number | ''>('');
  const [bookingFecha, setBookingFecha] = useState<string>('');
  const [bookingHora, setBookingHora] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<CitaDB | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);

  // Dynamic list of specialties combining base + active DB funcionarios
  const tiposAtencionDisponibles = useMemo(() => {
    const set = new Set<string>(TIPOS_ATENCION_BASE);
    funcionariosActivos.forEach((f) => {
      if (f.especialidad) set.add(f.especialidad);
    });
    return Array.from(set);
  }, [funcionariosActivos]);

  // Active professionals filtered by selected "TIPO DE ATENCIÓN"
  const profesionalesFiltrados = useMemo(() => {
    return funcionariosActivos.filter(
      (f) => f.activo && f.especialidad === bookingEspecialidad
    );
  }, [funcionariosActivos, bookingEspecialidad]);

  const selectedProfesional = useMemo(() => {
    if (typeof bookingFuncionarioId === 'number') {
      return profesionalesFiltrados.find((f) => f.funcionario_id === bookingFuncionarioId) || null;
    }
    return profesionalesFiltrados[0] || null;
  }, [bookingFuncionarioId, profesionalesFiltrados]);

  const findFirstAvailableDate = useCallback(
    (funcId: number, occupied: CitaDB[]): string => {
      const d = new Date();
      for (let i = 0; i < 45; i++) {
        const candidate = toISODateLocal(d);
        const avail = getDayAvailability(occupied, funcId, candidate);
        if (avail.status === 'available') return candidate;
        d.setDate(d.getDate() + 1);
      }
      return '';
    },
    []
  );

  // Load real data directly from Supabase
  const refreshSupabaseData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      const [funcRes, occRes, myRes] = await Promise.all([
        fetchActiveFuncionarios(),
        fetchOccupiedCitas(),
        usuario.usuario_id
          ? fetchCitasByUsuario(usuario.usuario_id)
          : Promise.resolve({ data: [] as CitaDB[], error: undefined }),
      ]);

      if (funcRes.error) setDataError(funcRes.error);
      if (occRes.error) setDataError(occRes.error);
      if (myRes.error) setDataError(myRes.error);

      setFuncionariosActivos(funcRes.data);
      setOccupiedCitas(occRes.data);
      setMisCitas(myRes.data);

      return { funcs: funcRes.data, occ: occRes.data, mine: myRes.data };
    } finally {
      setLoadingData(false);
    }
  }, [usuario.usuario_id]);

  useEffect(() => {
    refreshSupabaseData();
  }, [refreshSupabaseData]);

  // Keep selected doctor & date synchronized when specialty or loaded professionals change
  useEffect(() => {
    if (profesionalesFiltrados.length === 0) {
      setBookingFuncionarioId('');
      setBookingFecha('');
      setBookingHora('');
      return;
    }

    const stillValid = profesionalesFiltrados.some(
      (p) => p.funcionario_id === bookingFuncionarioId
    );
    const activeProf = stillValid
      ? profesionalesFiltrados.find((p) => p.funcionario_id === bookingFuncionarioId)!
      : profesionalesFiltrados[0];

    if (!stillValid) {
      setBookingFuncionarioId(activeProf.funcionario_id);
    }

    const currentDateValid =
      bookingFecha &&
      getDayAvailability(occupiedCitas, activeProf.funcionario_id, bookingFecha).status ===
        'available';

    if (!currentDateValid) {
      const nextDate = findFirstAvailableDate(activeProf.funcionario_id, occupiedCitas);
      setBookingFecha(nextDate);
      setBookingHora('');
    }
  }, [profesionalesFiltrados, bookingFuncionarioId, bookingFecha, occupiedCitas, findFirstAvailableDate]);

  const handleEspecialidadChange = (newEsp: string) => {
    setBookingEspecialidad(newEsp);
    setBookingFuncionarioId('');
    setBookingFecha('');
    setBookingHora('');
    setBookingError(null);
  };

  const handleProfesionalChange = (newFuncId: number) => {
    setBookingFuncionarioId(newFuncId);
    const nextDate = findFirstAvailableDate(newFuncId, occupiedCitas);
    setBookingFecha(nextDate);
    setBookingHora('');
    setBookingError(null);
  };

  const handleSelectDate = (dateStr: string) => {
    setBookingFecha(dateStr);
    setBookingHora('');
    setBookingError(null);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!usuario.usuario_id) {
      setBookingError('No se encontró el ID numérico de su cuenta (usuario_id). Por favor vuelva a iniciar sesión.');
      return;
    }
    if (!selectedProfesional) {
      setBookingError('No hay un profesional disponible para la especialidad seleccionada.');
      return;
    }
    if (!bookingFecha) {
      setBookingError('Por favor seleccione una fecha disponible en verde.');
      return;
    }
    if (!bookingHora) {
      setBookingError('Por favor seleccione un horario disponible.');
      return;
    }

    setBookingSubmitting(true);

    try {
      const cargaSeleccionada = cargas.find((c) => c.id === bookingPara);
      const pacienteNombre = cargaSeleccionada
        ? cargaSeleccionada.nombre
        : `${usuario.nombre} ${usuario.apellidos}`;

      const res = await bookAppointmentInSupabase({
        usuario_id: usuario.usuario_id,
        funcionario_id: selectedProfesional.funcionario_id,
        paciente_nombre: pacienteNombre,
        tipo_atencion: bookingEspecialidad,
        fecha: bookingFecha,
        hora: bookingHora,
        lugar: LUGAR_POSTA_DEFAULT,
      });

      if (!res.success) {
        // Show Supabase error and DO NOT add appointment to list
        setBookingError(res.error || 'No se pudo registrar la reserva. El cupo puede estar ocupado.');
        // Reload occupied slots from Supabase so UI immediately reflects latest state
        const occRes = await fetchOccupiedCitas();
        setOccupiedCitas(occRes.data);
        setBookingHora('');
        return;
      }

      // Reload fresh data from Supabase
      await refreshSupabaseData();
      setBookingSuccess(
        res.cita || {
          cita_id: 0,
          usuario_id: usuario.usuario_id,
          funcionario_id: selectedProfesional.funcionario_id,
          paciente_nombre: pacienteNombre,
          tipo_atencion: bookingEspecialidad,
          fecha: bookingFecha,
          hora: bookingHora,
          lugar: LUGAR_POSTA_DEFAULT,
          estado: 'Confirmada',
          funcionarios: selectedProfesional,
        }
      );
      setBookingHora('');

      setTimeout(() => {
        setBookingSuccess(null);
        setActiveView('mis-citas');
      }, 2200);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleConfirmCancelCita = async (citaId: number) => {
    setCancelling(true);
    setDataError(null);
    try {
      const res = await updateCitaEstadoInSupabase(citaId, 'Cancelada');
      if (!res.success) {
        setDataError(`No se pudo anular la cita: ${res.error}`);
        return;
      }

      const refreshed = await refreshSupabaseData();
      setConfirmingCancelId(null);

      if (selectedCita && selectedCita.cita_id === citaId) {
        const updatedCita = refreshed.mine.find((c) => c.cita_id === citaId) || null;
        setSelectedCita(updatedCita);
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleAddCarga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCargaNombre.trim() || !newCargaRut.trim()) return;
    const nueva: CargaFamiliar = {
      id: `carga-${Date.now()}`,
      nombre: newCargaNombre.trim(),
      rut: newCargaRut.trim(),
      parentesco: newCargaParentesco,
      edad: parseInt(newCargaEdad) || 0,
    };
    setCargas((prev) => [...prev, nueva]);
    setNewCargaNombre('');
    setNewCargaRut('');
    setShowAddCargaModal(false);
  };

  const openReservarView = async (preselectedPara?: string) => {
    if (preselectedPara) setBookingPara(preselectedPara);
    setBookingError(null);
    setBookingSuccess(null);
    setActiveView('reservar');
    await refreshSupabaseData();
  };

  const openMisCitasView = async () => {
    setActiveView('mis-citas');
    await refreshSupabaseData();
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-6 flex flex-col min-h-screen">
      {/* 1. Encabezado de Bienvenida */}
      <header className="flex items-center justify-between pb-4 pt-1 border-b border-sky-100">
        <div
          onClick={() => setActiveView('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <img
            src={RURALMED_LOGO_URL}
            alt="RuralMed"
            className="h-[40px] w-auto object-contain rounded-lg"
          />
          <span className="text-xs font-medium text-slate-500 border-l border-slate-200 pl-2.5">
            Su salud, cerca
          </span>
        </div>

        {/* Icono de Perfil de Usuario a la derecha */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            aria-label="Ver perfil de usuario"
            className="w-11 h-11 rounded-full bg-sky-50 border-2 border-sky-200 text-sky-800 flex items-center justify-center shadow-xs hover:bg-sky-100 active:scale-95 transition-all cursor-pointer relative"
          >
            <UserIcon className="w-5 h-5 stroke-[2.2]" />
            <span className="sr-only">Perfil de {usuario.nombre}</span>
          </button>
        </div>
      </header>

      {/* Greeting message */}
      <div className="mt-6 mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hola, {usuario.nombre}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          ¿Qué atención médica necesita gestionar hoy?
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* VIEW: HOME (2x2 Grid) */}
        {activeView === 'home' && (
          <div className="animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5 mt-2">
              <button
                type="button"
                onClick={() => openReservarView()}
                className="group p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 active:scale-95 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[145px] sm:min-h-[165px]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors shadow-inner">
                  <Calendar className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-snug">
                  Reservar Hora
                </span>
              </button>

              <button
                type="button"
                onClick={openMisCitasView}
                className="group p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 active:scale-95 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[145px] sm:min-h-[165px]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-colors shadow-inner">
                  <ClipboardList className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-snug">
                  Mis Citas
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('cargas')}
                className="group p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 active:scale-95 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[145px] sm:min-h-[165px]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors shadow-inner">
                  <Users className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-snug">
                  Cargas Familiares
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('derivaciones')}
                className="group p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 active:scale-95 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[145px] sm:min-h-[165px]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-colors shadow-inner">
                  <FileSignature className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-snug">
                  Derivaciones
                </span>
              </button>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={onOpenEmergency}
                className="w-full min-h-[50px] p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-rose-600" />
                <span>Llamar a Urgencias Médicas (SAMU 131)</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBVIEW 1: RESERVAR HORA MÉDICA (100% Supabase) */}
        {activeView === 'reservar' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('home')}
                  className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Volver al menú"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Reservar Hora Médica</h2>
                  <p className="text-xs text-slate-500">{LUGAR_POSTA_DEFAULT}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={refreshSupabaseData}
                aria-label="Actualizar disponibilidad"
                className="p-2 rounded-xl text-slate-500 hover:text-sky-700 hover:bg-sky-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">¡Hora Reservada con Éxito!</h3>
                <p className="text-sm text-slate-600 mt-1.5 max-w-sm mx-auto">
                  Cita confirmada con{' '}
                  <strong>{bookingSuccess.funcionarios?.nombre_completo || 'Profesional asignado'}</strong>{' '}
                  para el <strong>{bookingSuccess.fecha}</strong> a las{' '}
                  <strong>{bookingSuccess.hora}</strong>.
                </p>
                <p className="text-xs text-sky-700 font-semibold mt-2">
                  Redirigiendo a Mis Citas Médicas...
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {(bookingError || dataError) && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs sm:text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="font-medium">{bookingError || dataError}</p>
                  </div>
                )}

                {/* Paciente a atender */}
                <div>
                  <label className="block text-xs font-bold tracking-wide text-slate-700 mb-1.5">
                    ¿Para quién es la atención?
                  </label>
                  <select
                    value={bookingPara}
                    onChange={(e) => setBookingPara(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200 text-slate-900 font-semibold focus:border-sky-600 bg-white"
                  >
                    <option value="titular">
                      {usuario.nombre} {usuario.apellidos} (Titular)
                    </option>
                    {cargas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.parentesco})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1. TIPO DE ATENCIÓN */}
                <div>
                  <label className="block text-xs font-bold tracking-wide text-slate-700 mb-1.5">
                    Tipo de Atención
                  </label>
                  <select
                    value={bookingEspecialidad}
                    onChange={(e) => handleEspecialidadChange(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200 text-slate-900 font-semibold focus:border-sky-600 bg-white"
                  >
                    {tiposAtencionDisponibles.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. PROFESIONAL / DOCTOR (desde tabla `funcionarios` con activo=true) */}
                <div>
                  <label className="block text-xs font-bold tracking-wide text-slate-700 mb-1.5">
                    Profesional / Doctor
                  </label>
                  {profesionalesFiltrados.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                      No hay profesionales activos registrados para &quot;{bookingEspecialidad}&quot; en Supabase.
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedProfesional?.funcionario_id || ''}
                        onChange={(e) => handleProfesionalChange(Number(e.target.value))}
                        className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-sky-200 bg-sky-50/40 text-slate-900 font-semibold focus:border-sky-600"
                      >
                        {profesionalesFiltrados.map((prof) => (
                          <option key={prof.funcionario_id} value={prof.funcionario_id}>
                            {prof.nombre_completo} — {prof.rol}
                          </option>
                        ))}
                      </select>
                      {selectedProfesional && (
                        <p className="text-xs text-sky-800 mt-1.5 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                          <span>{getBoxPorRol(selectedProfesional.rol, selectedProfesional.especialidad)}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* 3. FECHA DE ATENCIÓN */}
                {selectedProfesional && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold tracking-wide text-slate-700">
                        Fecha de Atención
                      </label>
                      {bookingFecha && (
                        <span className="text-xs font-bold text-sky-700">{bookingFecha}</span>
                      )}
                    </div>
                    <AvailabilityCalendar
                      funcionarioId={selectedProfesional.funcionario_id}
                      occupiedCitas={occupiedCitas}
                      selectedDate={bookingFecha}
                      onSelectDate={handleSelectDate}
                    />
                  </div>
                )}

                {/* 4. HORARIO PREFERENTE */}
                {selectedProfesional && bookingFecha && (
                  <div>
                    <label className="block text-xs font-bold tracking-wide text-slate-700 mb-2">
                      Horario Preferente
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {HORARIOS_POSTA.map((time) => {
                        const occupied = isSlotOccupied(
                          occupiedCitas,
                          selectedProfesional.funcionario_id,
                          bookingFecha,
                          time
                        );
                        const isSelected = bookingHora === time && !occupied;

                        if (occupied) {
                          return (
                            <button
                              key={time}
                              type="button"
                              disabled
                              className="min-h-[56px] px-3 py-2 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-700 flex flex-col items-center justify-center cursor-not-allowed opacity-90"
                            >
                              <span className="text-sm font-extrabold tabular-nums">{time}</span>
                              <span className="text-[11px] font-bold text-rose-600 mt-0.5">
                                No disponible
                              </span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              setBookingHora(time);
                              setBookingError(null);
                            }}
                            className={`min-h-[56px] px-3 py-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-sky-600 border-sky-700 text-white shadow-md ring-2 ring-sky-200'
                                : 'bg-sky-50/70 border-sky-300 text-sky-950 hover:bg-sky-100'
                            }`}
                          >
                            <span className="text-sm font-extrabold tabular-nums">{time}</span>
                            <span
                              className={`text-[11px] font-semibold mt-0.5 ${
                                isSelected ? 'text-sky-100' : 'text-sky-700'
                              }`}
                            >
                              Disponible
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Confirmar Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={bookingSubmitting || !selectedProfesional || !bookingFecha || !bookingHora}
                    className="w-full min-h-[52px] rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-base shadow-md shadow-sky-700/20 active:scale-[0.99] transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CalendarPlus className="w-5 h-5" />
                    <span>{bookingSubmitting ? 'Guardando en Supabase...' : 'Confirmar Reserva'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* SUBVIEW 2: MIS CITAS MÉDICAS (100% Supabase con JOIN a `funcionarios`) */}
        {activeView === 'mis-citas' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('home')}
                  className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Volver al menú"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Mis Citas Médicas</h2>
                  <p className="text-xs text-slate-500">Presione cualquier cita para ver el detalle completo</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={refreshSupabaseData}
                  aria-label="Recargar citas"
                  className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => openReservarView()}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs hover:bg-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Hora</span>
                </button>
              </div>
            </div>

            {dataError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {dataError}
              </div>
            )}

            {loadingData ? (
              <div className="py-10 text-center text-slate-500 text-sm font-semibold">
                Consultando sus citas en Supabase...
              </div>
            ) : misCitas.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No tiene citas agendadas actualmente</p>
                <button
                  type="button"
                  onClick={() => openReservarView()}
                  className="mt-3 min-h-[44px] px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Reservar una hora
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {misCitas.map((cita) => (
                  <button
                    key={cita.cita_id}
                    type="button"
                    onClick={() => {
                      setConfirmingCancelId(null);
                      setSelectedCita(cita);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      cita.estado === 'Cancelada'
                        ? 'border-slate-200 bg-slate-50/70 opacity-80 hover:opacity-100'
                        : 'border-slate-200 bg-white hover:border-sky-400 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                        {cita.tipo_atencion}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md shrink-0 ${getEstadoBadgeStyle(
                          cita.estado
                        )}`}
                      >
                        {cita.estado}
                      </span>
                    </div>

                    {/* Nombre real y completo del doctor desde JOIN funcionarios */}
                    <div className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-800">
                      <Stethoscope className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>
                        {cita.funcionarios?.nombre_completo || `Profesional #${cita.funcionario_id}`}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="tabular-nums">
                          {cita.fecha} · <strong>{cita.hora}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{cita.lugar}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium truncate">
                        Paciente: <strong className="text-slate-700">{cita.paciente_nombre}</strong>
                      </span>
                      <span className="text-sky-700 font-bold flex items-center gap-0.5 shrink-0">
                        Ver detalle
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW 3: CARGAS FAMILIARES */}
        {activeView === 'cargas' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('home')}
                  className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Volver al menú"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Cargas Familiares</h2>
                  <p className="text-xs text-slate-500">Agregue familiares para reservar horas a su nombre</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCargaModal(true)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs hover:bg-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            {cargas.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No tiene cargas familiares agregadas</p>
                <p className="text-xs mt-1">
                  Presione &quot;+ Agregar&quot; para inscribir a un adulto mayor o familiar a su cargo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cargas.map((carga) => (
                  <div
                    key={carga.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">{carga.nombre}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        RUT: <strong>{carga.rut}</strong> · {carga.parentesco} ({carga.edad} años)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openReservarView(carga.id)}
                      className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shrink-0 active:scale-95 transition-all cursor-pointer"
                    >
                      Agendar Hora
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW 4: DERIVACIONES */}
        {activeView === 'derivaciones' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Volver al menú"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Interconsultas y Derivaciones</h2>
                <p className="text-xs text-slate-500">Derivaciones a especialistas y hospitales base</p>
              </div>
            </div>

            <div className="py-8 text-center text-slate-500">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No registra derivaciones activas</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">
                Cuando un médico de la posta genere una interconsulta a hospital base, aparecerá aquí automáticamente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE DE CITA MÉDICA */}
      {selectedCita && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-cita-title"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedCita(null);
                setConfirmingCancelId(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cerrar detalle de cita"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-8">
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md mb-2 ${getEstadoBadgeStyle(
                  selectedCita.estado
                )}`}
              >
                Estado: {selectedCita.estado}
              </span>
              <h3 id="detalle-cita-title" className="text-xl font-extrabold text-slate-900 leading-tight">
                {selectedCita.tipo_atencion}
              </h3>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              {/* Profesional asignado */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 block">
                  Profesional Asignado
                </span>
                <p className="font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>
                    {selectedCita.funcionarios?.nombre_completo ||
                      `Profesional #${selectedCita.funcionario_id}`}
                  </span>
                </p>
              </div>

              {/* Paciente atendido */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Paciente Atendido
                </span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedCita.paciente_nombre}</p>
                <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                  RUT Titular: <strong>{usuario.rut}</strong>
                </p>
              </div>

              {/* Fecha y hora */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Fecha Exacta
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5 capitalize text-xs sm:text-sm">
                    {formatFechaHumana(selectedCita.fecha)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Bloque Horario
                  </span>
                  <p className="font-extrabold text-sky-800 mt-0.5 flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>{selectedCita.hora}</span>
                  </p>
                </div>
              </div>

              {/* Lugar y Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Lugar de Atención y Box
                </span>
                <p className="font-bold text-slate-900 mt-0.5 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>{selectedCita.lugar}</span>
                </p>
                <p className="text-xs font-semibold text-sky-800 mt-1 ml-5">
                  {getBoxPorRol(
                    selectedCita.funcionarios?.rol || 'Médico',
                    selectedCita.tipo_atencion
                  )}
                </p>
              </div>

              {/* Indicaciones previas */}
              <div className="p-3.5 rounded-2xl bg-sky-50/40 border border-sky-200/70 flex items-start gap-2.5 text-xs text-slate-700">
                <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Indicaciones previas</span>
                  <p>{getIndicacionesPorEspecialidad(selectedCita.tipo_atencion)}</p>
                </div>
              </div>
            </div>

            {/* Botón Anular Hora */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
              {(selectedCita.estado === 'Confirmada' || selectedCita.estado === 'En Espera') && (
                <>
                  {confirmingCancelId === selectedCita.cita_id ? (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                      <p className="text-xs font-bold text-rose-900">
                        ¿Confirma que desea anular esta hora? El cupo quedará inmediatamente libre en Supabase.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={cancelling}
                          onClick={() => setConfirmingCancelId(null)}
                          className="min-h-[42px] rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Mantener hora
                        </button>
                        <button
                          type="button"
                          disabled={cancelling}
                          onClick={() => handleConfirmCancelCita(selectedCita.cita_id)}
                          className="min-h-[42px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer disabled:opacity-60"
                        >
                          {cancelling ? 'Anulando...' : 'Sí, anular hora'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingCancelId(selectedCita.cita_id)}
                      className="w-full min-h-[48px] rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm transition-colors cursor-pointer"
                    >
                      Anular hora
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedCita(null);
                  setConfirmingCancelId(null);
                }}
                className="w-full min-h-[46px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL / DRAWER */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cerrar perfil"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-sky-700/20">
                {usuario.nombre.charAt(0)}
                {usuario.apellidos.charAt(0)}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                  {usuario.nombre} {usuario.apellidos}
                </h3>
                <span className="text-xs font-semibold text-sky-700 mt-0.5 inline-block">
                  Paciente Rural Activo
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">RUT</span>
                <span className="font-bold text-slate-900 tabular-nums">{usuario.rut}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Celular (Clave)</span>
                <span className="font-bold text-slate-900 tabular-nums">{usuario.celular}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Fecha de Nacimiento</span>
                <span className="font-bold text-slate-900 tabular-nums">{usuario.fecha_nacimiento}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Localidad / Ciudad</span>
                <span className="font-bold text-slate-900">{usuario.ciudad}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Dirección</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{usuario.direccion}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Correo</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{usuario.email}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Tamaño de letra:</span>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFontSize('normal')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    fontSize === 'normal' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('large')}
                  className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    fontSize === 'large' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('xl')}
                  className={`px-2.5 py-1 text-base font-bold rounded-lg transition-all cursor-pointer ${
                    fontSize === 'xl' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  A++
                </button>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  onLogout();
                }}
                className="w-full min-h-[48px] rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR CARGA FAMILIAR */}
      {showAddCargaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowAddCargaModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar Carga Familiar</h3>

            <form onSubmit={handleAddCarga} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pedro González"
                  value={newCargaNombre}
                  onChange={(e) => setNewCargaNombre(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">RUT</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 19.876.543-2"
                  value={newCargaRut}
                  onChange={(e) => setNewCargaRut(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parentesco</label>
                <select
                  value={newCargaParentesco}
                  onChange={(e) => setNewCargaParentesco(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900 bg-white"
                >
                  <option value="Padre / Madre">Padre / Madre</option>
                  <option value="Hijo / Hija">Hijo / Hija</option>
                  <option value="Cónyuge">Cónyuge</option>
                  <option value="Adulto Mayor a Cargo">Adulto Mayor a Cargo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Edad</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  value={newCargaEdad}
                  onChange={(e) => setNewCargaEdad(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[46px] rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-all cursor-pointer"
                >
                  Guardar Familiar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
