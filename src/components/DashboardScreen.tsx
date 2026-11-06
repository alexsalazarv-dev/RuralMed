import React, { useState } from 'react';
import { Usuario } from '../lib/supabase.ts';
import {
  HeartPulse,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  Clock,
  Pill,
  Truck,
  CheckCircle2,
  Stethoscope,
  LogOut,
  AlertTriangle,
  PhoneCall,
  Activity,
  FileText,
  Send,
  HelpCircle
} from 'lucide-react';

interface DashboardScreenProps {
  usuario: Usuario;
  onLogout: () => void;
  onOpenEmergency: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  usuario,
  onLogout,
  onOpenEmergency,
}) => {
  const [activeTab, setActiveTab] = useState<'ficha' | 'ronda' | 'farmacia' | 'visita'>('ficha');
  const [requestSent, setRequestSent] = useState(false);
  const [motivoVisita, setMotivoVisita] = useState('');
  const [urgenciaNivel, setUrgenciaNivel] = useState('normal');

  // Compute patient age
  const calculateAge = (birthDateString: string) => {
    try {
      const birth = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return isNaN(age) ? null : age;
    } catch {
      return null;
    }
  };

  const edad = calculateAge(usuario.fecha_nacimiento);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoVisita.trim()) return;
    setRequestSent(true);
    setTimeout(() => {
      setMotivoVisita('');
      setRequestSent(false);
    }, 4500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      
      {/* Alerta Destacada de Bienvenida (Requisito fundamental) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white shadow-xl shadow-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-600/40">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold bg-emerald-500/40 text-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Ficha Activa en Supabase
              </span>
              <span className="text-xs text-emerald-200">
                {usuario.ciudad}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
              ¡Bienvenido/a, {usuario.nombre} {usuario.apellidos}!
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 mt-0.5">
              Su ficha médica rural se encuentra sincronizada y conectada con su posta de salud local.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-emerald-800" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs for Rural Health Dashboard */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('ficha')}
          className={`min-h-[46px] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'ficha'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Ficha del Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ronda')}
          className={`min-h-[46px] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'ronda'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Ronda Médica Rural</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('farmacia')}
          className={`min-h-[46px] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'farmacia'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Farmacia & Medicamentos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visita')}
          className={`min-h-[46px] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'visita'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Solicitar Visita a Domicilio</span>
        </button>
      </div>

      {/* TAB 1: FICHA DEL PACIENTE (Datos desde Supabase) */}
      {activeTab === 'ficha' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main User Profile Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Registro Clínico Electrónico
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  Datos Oficiales del Paciente
                </h2>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* RUT */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 block mb-1">RUT</span>
                <p className="text-lg font-bold text-slate-900">{usuario.rut}</p>
                <span className="text-[11px] text-slate-500">Documento de identidad validado</span>
              </div>

              {/* Nombre Completo */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Nombre Completo</span>
                <p className="text-lg font-bold text-slate-900">{usuario.nombre} {usuario.apellidos}</p>
                <span className="text-[11px] text-slate-500">Paciente titular de la ficha</span>
              </div>

              {/* Fecha de Nacimiento y Edad */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Fecha de Nacimiento</span>
                <p className="text-lg font-bold text-slate-900">
                  {usuario.fecha_nacimiento} {edad !== null && <span className="text-emerald-700 font-semibold text-base">({edad} años)</span>}
                </p>
                <span className="text-[11px] text-slate-500">
                  {edad !== null && edad >= 60 ? 'Paciente con beneficios de adulto mayor' : 'Edad del paciente'}
                </span>
              </div>

              {/* Celular */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Número de Celular</span>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{usuario.celular}</span>
                </p>
                <span className="text-[11px] text-emerald-700 font-medium">Clave de acceso y contacto prioritario</span>
              </div>

              {/* Email */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Correo Electrónico</span>
                <p className="text-base sm:text-lg font-bold text-slate-900 break-all flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{usuario.email}</span>
                </p>
                <span className="text-[11px] text-slate-500">Para avisos y recetas electrónicas</span>
              </div>

              {/* Ciudad / Comuna */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Comuna o Ciudad</span>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>{usuario.ciudad}</span>
                </p>
                <span className="text-[11px] text-slate-500">Jurisdicción de atención de salud</span>
              </div>

              {/* Dirección */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Dirección / Sector Rural</span>
                <p className="text-lg font-bold text-slate-900 flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{usuario.direccion}</span>
                </p>
                <span className="text-[11px] text-slate-500">Referencia para visitas domiciliarias y rondas médicas</span>
              </div>

            </div>

            {/* Practical Advice */}
            <div className="mt-8 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-emerald-950">
                <p className="font-bold">Información respaldada en Supabase</p>
                <p className="mt-0.5 text-emerald-800">
                  Sus datos están seguros. Cada vez que ingrese con su RUT y Celular verá reflejada su ficha médica actualizada.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Emergency Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Urgencias Card */}
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3 text-rose-800">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
                <h3 className="font-bold text-lg">¿Urgencia en su Sector?</h3>
              </div>
              <p className="text-xs sm:text-sm text-rose-900/90 mb-4 leading-relaxed">
                Si usted o un familiar presenta dolor intenso en el pecho, dificultad para respirar o pérdida de consciencia:
              </p>
              <button
                type="button"
                onClick={onOpenEmergency}
                className="w-full min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-95 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                Ver Teléfonos de Urgencia (131)
              </button>
            </div>

            {/* Posta Rural Status */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Posta de Salud Rural</h3>
                  <p className="text-xs text-slate-500">Sector {usuario.ciudad}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span>Horario de atención:</span>
                  <span className="font-bold text-slate-900">08:00 - 17:00 hrs</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span>Paramédico de turno:</span>
                  <span className="font-bold text-slate-900">En posta</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ambulancia local:</span>
                  <span className="font-bold text-emerald-700">Disponible</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <a
                  href={`tel:6003607777`}
                  className="w-full min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-700" />
                  Salud Responde: 600 360 7777
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: RONDA MÉDICA RURAL */}
      {activeTab === 'ronda' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Calendario de Rondas Médicas en {usuario.ciudad}
              </h2>
              <p className="text-sm text-slate-500">
                Visita del equipo multidisciplinario (Médico, Enfermera, Kinesiólogo y Asistente Social).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-600 text-white inline-block mb-1">
                  Próxima Ronda Programada
                </span>
                <h3 className="text-lg font-bold text-slate-900">Operativo de Salud y Control Cardiovascular</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Toma de presión arterial, glicemia, recetas de crónicos y consulta médica general.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 mt-3">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-600" /> Miércoles 11 de Noviembre</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-600" /> 09:30 a 14:00 hrs</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-600" /> Posta Rural de {usuario.ciudad}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert(`Su asistencia ha sido pre-inscrita para la ronda en ${usuario.ciudad}. Se le enviará un SMS de confirmación al ${usuario.celular}.`)}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shrink-0 active:scale-95 transition-all cursor-pointer"
              >
                Inscribirme en la Ronda
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 inline-block mb-1">
                  Siguiente Ronda
                </span>
                <h3 className="text-base font-bold text-slate-900">Control Dental y Podológico Adulto Mayor</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Clínica móvil con atención dental básica y cuidado de pie diabético.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 mt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Martes 24 de Noviembre</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 10:00 a 15:30 hrs</span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1.5 rounded-lg">
                Inscripciones abiertas pronto
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FARMACIA & MEDICAMENTOS */}
      {activeTab === 'farmacia' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Farmacia y Despacho Rural de Medicamentos
              </h2>
              <p className="text-sm text-slate-500">
                Gestión de recetas GES, crónicos y botiquines familiares para {usuario.nombre}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Medicamento Crónico 1 */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-base">Losartán Potásico 50mg</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Disponible
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Tratamiento Hipertensión Arterial · 1 comprimido cada 12 horas.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Retiro: Posta {usuario.ciudad}</span>
                <span className="font-semibold text-slate-800">Receta vigente hasta Dic 2026</span>
              </div>
            </div>

            {/* Medicamento Crónico 2 */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-base">Metformina 850mg</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Disponible
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Control Diabetes Tipo 2 · 1 comprimido con el almuerzo.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Retiro: Posta {usuario.ciudad}</span>
                <span className="font-semibold text-slate-800">Receta vigente hasta Dic 2026</span>
              </div>
            </div>

          </div>

          <div className="mt-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-teal-700 shrink-0" />
              <div>
                <p className="font-bold text-sm sm:text-base text-teal-950">
                  ¿Tiene dificultades de traslado a la posta?
                </p>
                <p className="text-xs sm:text-sm text-teal-800">
                  Podemos despachar sus medicamentos a su domicilio en {usuario.direccion}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert(`Solicitud de despacho a domicilio registrada para ${usuario.direccion}. El paramédico se contactará a su celular ${usuario.celular}.`)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm shrink-0 active:scale-95 transition-all cursor-pointer"
            >
              Pedir Despacho
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SOLICITAR VISITA DOMICILIARIA */}
      {activeTab === 'visita' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Solicitud de Visita Médica Domiciliaria
              </h2>
              <p className="text-sm text-slate-500">
                Especial para personas con movilidad reducida o adultos mayores en zonas apartadas.
              </p>
            </div>
          </div>

          {requestSent ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-300 text-center animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-emerald-950">¡Solicitud Enviada a la Posta Rural!</h3>
              <p className="text-sm text-emerald-800 mt-1 max-w-md mx-auto">
                El equipo de salud rural de {usuario.ciudad} ha recibido su requerimiento y lo llamará al <strong>{usuario.celular}</strong> para coordinar la hora de visita en <strong>{usuario.direccion}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit} className="space-y-5 max-w-2xl">
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">
                  Motivo de la solicitud o síntomas
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivoVisita}
                  onChange={(e) => setMotivoVisita(e.target.value)}
                  placeholder="Ej: Dolor de espalda, control de presión arterial, curación de herida, paciente postrado..."
                  className="w-full p-4 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">
                  Nivel de Urgencia
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUrgenciaNivel('normal')}
                    className={`min-h-[48px] px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                      urgenciaNivel === 'normal'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Control Habitual / Rutinario
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgenciaNivel('prioritario')}
                    className={`min-h-[48px] px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                      urgenciaNivel === 'prioritario'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Atención Prioritaria (En 24-48 hrs)
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <p>
                  📍 <strong>Lugar de visita:</strong> {usuario.direccion}, {usuario.ciudad}.
                </p>
                <p className="mt-1">
                  📞 <strong>Teléfono de contacto:</strong> {usuario.celular} (Paciente: {usuario.nombre} {usuario.apellidos}).
                </p>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto min-h-[50px] px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Solicitud a la Posta</span>
              </button>

            </form>
          )}

        </div>
      )}

    </div>
  );
};
