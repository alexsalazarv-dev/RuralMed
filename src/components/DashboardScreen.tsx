import React, { useState } from 'react';
import { Usuario } from '../lib/supabase.ts';
import {
  HeartPulse,
  Calendar,
  ClipboardList,
  Users,
  FileSignature,
  User as UserIcon,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  CalendarPlus,
  Building2,
  Phone,
  Mail,
  CreditCard,
  X,
  PhoneCall,
  Plus,
  ChevronRight,
  ShieldAlert,
  Stethoscope,
  Share2
} from 'lucide-react';

interface DashboardScreenProps {
  usuario: Usuario;
  onLogout: () => void;
  onOpenEmergency: () => void;
  fontSize: 'normal' | 'large' | 'xl';
  setFontSize: (size: 'normal' | 'large' | 'xl') => void;
}

interface Cita {
  id: string;
  especialidad: string;
  profesional: string;
  fecha: string;
  hora: string;
  lugar: string;
  estado: 'Confirmada' | 'En Espera' | 'Completada';
}

interface CargaFamiliar {
  id: string;
  nombre: string;
  rut: string;
  parentesco: string;
  edad: number;
}

interface Derivacion {
  id: string;
  especialidad: string;
  hospital: string;
  fechaSolicitud: string;
  estado: 'En Evaluación' | 'Cita Asignada' | 'En Lista de Espera';
  prioridad: 'Alta' | 'Media';
  medicoSolicitante: string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  usuario,
  onLogout,
  onOpenEmergency,
  fontSize,
  setFontSize,
}) => {
  // Navigation inside Dashboard: 'home' (the 2x2 grid) or one of the 4 modules
  const [activeView, setActiveView] = useState<'home' | 'reservar' | 'mis-citas' | 'cargas' | 'derivaciones'>('home');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Initial mock data for Citas
  const [citas, setCitas] = useState<Cita[]>([
    {
      id: '1',
      especialidad: 'Control Cardiovascular y Crónico',
      profesional: 'Dr. Alejandro Morales',
      fecha: '2026-11-18',
      hora: '10:30 hrs',
      lugar: `Posta de Salud Rural de ${usuario.ciudad}`,
      estado: 'Confirmada',
    },
    {
      id: '2',
      especialidad: 'Ronda Médica General',
      profesional: 'Equipo Multidisciplinario',
      fecha: '2026-11-26',
      hora: '11:45 hrs',
      lugar: `Sede Comunitaria - Sector ${usuario.ciudad}`,
      estado: 'En Espera',
    },
  ]);

  // Initial mock data for Cargas Familiares
  const [cargas, setCargas] = useState<CargaFamiliar[]>([
    {
      id: '1',
      nombre: 'Rosa María Silva',
      rut: '7.842.115-3',
      parentesco: 'Madre (Adulto Mayor)',
      edad: 78,
    },
    {
      id: '2',
      nombre: 'Matías González',
      rut: '22.341.980-4',
      parentesco: 'Hijo',
      edad: 14,
    },
  ]);

  // Initial mock data for Derivaciones
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([
    {
      id: '1',
      especialidad: 'Oftalmología (Vicio de Refracción / Cataratas)',
      hospital: `Hospital Provincial de Referencia (${usuario.ciudad})`,
      fechaSolicitud: '12 de Octubre, 2026',
      estado: 'Cita Asignada',
      prioridad: 'Alta',
      medicoSolicitante: 'Dra. Daniela Rojas (Médico EDF Rural)',
    },
    {
      id: '2',
      especialidad: 'Traumatología y Ortopedia',
      hospital: 'Hospital Base Regional',
      fechaSolicitud: '02 de Noviembre, 2026',
      estado: 'En Lista de Espera',
      prioridad: 'Media',
      medicoSolicitante: 'Dr. Alejandro Morales',
    },
  ]);

  // State for Booking Form
  const [bookingEspecialidad, setBookingEspecialidad] = useState('Médico General');
  const [bookingFecha, setBookingFecha] = useState('2026-11-20');
  const [bookingHora, setBookingHora] = useState('09:30');
  const [bookingPara, setBookingPara] = useState('titular');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // State for adding a new Family Member
  const [showAddCargaModal, setShowAddCargaModal] = useState(false);
  const [newCargaNombre, setNewCargaNombre] = useState('');
  const [newCargaRut, setNewCargaRut] = useState('');
  const [newCargaParentesco, setNewCargaParentesco] = useState('Padre / Madre');
  const [newCargaEdad, setNewCargaEdad] = useState('65');

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pacienteNombre = bookingPara === 'titular' ? `${usuario.nombre} ${usuario.apellidos}` : 'Carga Familiar';
    const nuevaCita: Cita = {
      id: Date.now().toString(),
      especialidad: bookingEspecialidad,
      profesional: 'Equipo Médico Rural',
      fecha: bookingFecha,
      hora: `${bookingHora} hrs`,
      lugar: `Posta de Salud Rural de ${usuario.ciudad}`,
      estado: 'Confirmada',
    };
    setCitas((prev) => [nuevaCita, ...prev]);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setActiveView('mis-citas');
    }, 2000);
  };

  const handleAddCarga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCargaNombre.trim() || !newCargaRut.trim()) return;
    const nueva: CargaFamiliar = {
      id: Date.now().toString(),
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

  const handleCancelarCita = (id: string) => {
    if (window.confirm('¿Está seguro de que desea anular esta cita médica?')) {
      setCitas((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-6 flex flex-col min-h-screen">
      
      {/* 1. Encabezado de Bienvenida */}
      <header className="flex items-center justify-between pb-4 pt-1 border-b border-slate-100">
        
        {/* Logo de RuralMed + Eslogan "Su salud, cerca" */}
        <div 
          onClick={() => setActiveView('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <HeartPulse className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
              Rural<span className="text-emerald-600">Med</span>
            </span>
            <span className="text-xs font-medium text-slate-500 block">
              Su salud, cerca
            </span>
          </div>
        </div>

        {/* Icono de Perfil de Usuario a la derecha */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            aria-label="Ver perfil de usuario"
            className="w-11 h-11 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-800 flex items-center justify-center shadow-xs hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer relative"
          >
            <UserIcon className="w-5 h-5 stroke-[2.2]" />
            <span className="sr-only">Perfil de {usuario.nombre}</span>
          </button>
        </div>

      </header>

      {/* Greeting message in friendly typography */}
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
            
            {/* Cuadrícula de Módulos (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5 mt-2">
              
              {/* Módulo 1: Reservar Hora */}
              <button
                type="button"
                onClick={() => setActiveView('reservar')}
                className="group p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 active:scale-95 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[145px] sm:min-h-[165px]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner">
                  <Calendar className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-snug">
                  Reservar Hora
                </span>
              </button>

              {/* Módulo 2: Mis Citas */}
              <button
                type="button"
                onClick={() => setActiveView('mis-citas')}
                className="group p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 active:scale-95 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[145px] sm:min-h-[165px]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors shadow-inner">
                  <ClipboardList className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-snug">
                  Mis Citas
                </span>
              </button>

              {/* Módulo 3: Cargas Familiares */}
              <button
                type="button"
                onClick={() => setActiveView('cargas')}
                className="group p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-300 active:scale-95 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[145px] sm:min-h-[165px]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-inner">
                  <Users className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-snug">
                  Cargas Familiares
                </span>
              </button>

              {/* Módulo 4: Derivaciones */}
              <button
                type="button"
                onClick={() => setActiveView('derivaciones')}
                className="group p-5 sm:p-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 active:scale-95 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[145px] sm:min-h-[165px]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                  <FileSignature className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight leading-snug">
                  Derivaciones
                </span>
              </button>

            </div>

            {/* Quick Emergency Assistance Button */}
            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={onOpenEmergency}
                className="w-full min-h-[50px] p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>Llamar a Urgencias Médicas (SAMU 131)</span>
              </button>
            </div>

          </div>
        )}

        {/* SUBVIEW 1: RESERVAR HORA */}
        {activeView === 'reservar' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Volver al menú"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Reservar Hora Médica</h2>
                <p className="text-xs text-slate-500">Posta y ronda médica de {usuario.ciudad}</p>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">¡Hora Reservada con Éxito!</h3>
                <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                  Hemos agendado su atención. Recibirá un recordatorio por SMS al {usuario.celular}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                
                {/* Paciente a atender */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    ¿Para quién es la atención?
                  </label>
                  <select
                    value={bookingPara}
                    onChange={(e) => setBookingPara(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-emerald-600 bg-white"
                  >
                    <option value="titular">{usuario.nombre} {usuario.apellidos} (Titular)</option>
                    {cargas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.parentesco})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Especialidad o Tipo de Atención */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tipo de Atención
                  </label>
                  <select
                    value={bookingEspecialidad}
                    onChange={(e) => setBookingEspecialidad(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-emerald-600 bg-white"
                  >
                    <option value="Médico General">Médico General / Consulta</option>
                    <option value="Control Cardiovascular y Crónico">Control Cardiovascular (Hipertensión / Diabetes)</option>
                    <option value="Enfermería y Curaciones">Enfermería / Curación de heridas</option>
                    <option value="Kinesiología Respiratoria y Motora">Kinesiología</option>
                    <option value="Control Dental Rural">Atención Dental Rural</option>
                    <option value="Toma de Muestras y Exámenes">Toma de Muestras y Sangre</option>
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Fecha de Atención
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingFecha}
                    onChange={(e) => setBookingFecha(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-emerald-600 bg-white"
                  />
                </div>

                {/* Hora */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Horario Preferente
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['09:30', '11:00', '14:30'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setBookingHora(time)}
                        className={`min-h-[44px] rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                          bookingHora === time
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {time} hrs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirmar Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full min-h-[50px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CalendarPlus className="w-5 h-5" />
                    <span>Confirmar Reserva</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

        {/* SUBVIEW 2: MIS CITAS */}
        {activeView === 'mis-citas' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('home')}
                  className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  aria-label="Volver al menú"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Mis Citas Médicas</h2>
                  <p className="text-xs text-slate-500">Historial y próximas horas programadas</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('reservar')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Hora</span>
              </button>
            </div>

            {citas.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No tiene citas agendadas actualmente</p>
                <button
                  type="button"
                  onClick={() => setActiveView('reservar')}
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Reservar una hora
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {citas.map((cita) => (
                  <div
                    key={cita.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {cita.especialidad}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        cita.estado === 'Confirmada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {cita.estado}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{cita.fecha} · <strong>{cita.hora}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{cita.lugar}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{cita.profesional}</span>
                      <button
                        type="button"
                        onClick={() => handleCancelarCita(cita.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                      >
                        Anular hora
                      </button>
                    </div>
                  </div>
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
                  className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  aria-label="Volver al menú"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Cargas Familiares</h2>
                  <p className="text-xs text-slate-500">Gestione la salud de familiares y dependientes</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCargaModal(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 font-bold text-xs hover:bg-teal-100 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

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
                    onClick={() => {
                      setBookingPara(carga.id);
                      setActiveView('reservar');
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 active:scale-95 transition-all"
                  >
                    Agendar Hora
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3.5 rounded-2xl bg-slate-100/70 text-xs text-slate-600 flex items-start gap-2">
              <Users className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>
                Las cargas familiares registradas pueden recibir atención en la posta rural bajo su número de contacto ({usuario.celular}).
              </span>
            </div>
          </div>
        )}

        {/* SUBVIEW 4: DERIVACIONES */}
        {activeView === 'derivaciones' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Volver al menú"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Interconsultas y Derivaciones</h2>
                <p className="text-xs text-slate-500">Derivaciones a especialistas y hospitales base</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {derivaciones.map((der) => (
                <div
                  key={der.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {der.especialidad}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      der.estado === 'Cita Asignada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {der.estado}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{der.hospital}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Fecha de ingreso de solicitud: {der.fechaSolicitud}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Médico que deriva: {der.medicoSolicitante}</span>
                    <span className="font-semibold text-slate-700">Prioridad: {der.prioridad}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
              <p className="font-bold">Información de Traslado Rural:</p>
              <p className="mt-0.5">
                Si requiere apoyo de traslado o ambulancia municipal para acudir al hospital provincial, coordine con su posta en {usuario.ciudad}.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* USER PROFILE MODAL / DRAWER */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in slide-in-from-bottom duration-200">
            
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar perfil"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-700/20">
                {usuario.nombre.charAt(0)}{usuario.apellidos.charAt(0)}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                  {usuario.nombre} {usuario.apellidos}
                </h3>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                  Paciente Rural Activo
                </span>
              </div>
            </div>

            {/* Details from Supabase */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">RUT</span>
                <span className="font-bold text-slate-900">{usuario.rut}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Celular (Clave)</span>
                <span className="font-bold text-slate-900">{usuario.celular}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Fecha de Nacimiento</span>
                <span className="font-bold text-slate-900">{usuario.fecha_nacimiento}</span>
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

            {/* Accessibility Font Size Toggle inside Profile */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Tamaño de letra:</span>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFontSize('normal')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    fontSize === 'normal' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('large')}
                  className={`px-2.5 py-1 text-sm font-bold rounded-lg transition-all ${
                    fontSize === 'large' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('xl')}
                  className={`px-2.5 py-1 text-base font-bold rounded-lg transition-all ${
                    fontSize === 'xl' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  A++
                </button>
              </div>
            </div>

            {/* Logout Button */}
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
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Agregar Carga Familiar
            </h3>

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
                  className="w-full min-h-[46px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all"
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
