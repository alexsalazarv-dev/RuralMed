import React, { useState } from 'react';
import { supabase, formatRUT, Usuario } from '../lib/supabase.ts';
import { LogIn, UserPlus, Phone, CreditCard, AlertCircle, Eye, EyeOff, ShieldCheck, Stethoscope, MapPin, Users } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (usuario: Usuario) => void;
  onGoToRegister: () => void;
  initialMessage?: string | null;
  heroImage: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoToRegister,
  initialMessage,
  heroImage,
}) => {
  const [rut, setRut] = useState('');
  const [celular, setCelular] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle RUT input formatting
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatRUT(raw);
    setRut(formatted);
    if (errorMessage) setErrorMessage(null);
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(e.target.value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRutVal = rut.trim();
    const cleanCelVal = celular.trim();

    if (!cleanRutVal || !cleanCelVal) {
      setErrorMessage('Por favor ingrese tanto su RUT como su Número de Celular.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Primary Query as required by specification:
      // supabase.from('usuarios').select('*').eq('rut', rut).eq('celular', celular)
      let { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rut', cleanRutVal)
        .eq('celular', cleanCelVal);

      // Resilient fallback for rural users: check if RUT was stored without dots or vice-versa
      if (!error && (!data || data.length === 0)) {
        const rawRutWithoutDots = cleanRutVal.replace(/\./g, '');
        const alternativeQuery = await supabase
          .from('usuarios')
          .select('*')
          .eq('rut', rawRutWithoutDots)
          .eq('celular', cleanCelVal);
        
        if (alternativeQuery.data && alternativeQuery.data.length > 0) {
          data = alternativeQuery.data;
          error = null;
        }
      }

      if (error) {
        console.error('Error al consultar usuarios en Supabase:', error);
        setErrorMessage(`Error de conexión con la base de datos (${error.message || 'Intente nuevamente'}).`);
        return;
      }

      if (data && data.length > 0) {
        const usuarioEncontrado = data[0] as Usuario;
        onLoginSuccess(usuarioEncontrado);
      } else {
        setErrorMessage(
          'No se encontró ningún usuario con ese RUT y Celular. Por favor verifique los datos o presione "Registrar / Nuevo Usuario".'
        );
      }
    } catch (err: unknown) {
      console.error('Excepción al conectar con Supabase:', err);
      setErrorMessage('No fue posible conectar con el servidor médico. Verifique su conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      
      {/* Informational Notification if redirected after registration */}
      {initialMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 shadow-sm animate-in fade-in">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm sm:text-base">¡Registro guardado con éxito!</p>
            <p className="text-xs sm:text-sm">{initialMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        
        {/* Left Column: Visual & Trust Section for Rural Communities */}
        <div className="lg:col-span-5 bg-gradient-to-b from-emerald-800 to-teal-900 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
            <img
              src={heroImage}
              alt="Atención médica en posta rural"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 backdrop-blur-sm border border-emerald-500/30 text-emerald-100 text-xs font-semibold mb-4">
              <Stethoscope className="w-4 h-4 text-emerald-300" />
              <span>Red Asistencial Rural</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Rural<span className="text-emerald-300">Med</span>
            </h1>
            <p className="mt-2 text-base sm:text-lg text-emerald-100/90 leading-relaxed">
              Atención médica y seguimiento de salud cercano para nuestras familias, parcelas y localidades rurales.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-700/40 border border-emerald-500/30 text-emerald-200 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm sm:text-base text-white">Acceso Simple y Seguro</h2>
                  <p className="text-xs sm:text-sm text-emerald-200/80">
                    Solo necesita su <strong>RUT</strong> y su <strong>número de celular</strong>. Sin contraseñas complicadas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-700/40 border border-emerald-500/30 text-emerald-200 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm sm:text-base text-white">Conexión con su Posta Rural</h2>
                  <p className="text-xs sm:text-sm text-emerald-200/80">
                    Coordinación de rondas médicas, entrega de fármacos y visitas a domicilio.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-700/40 border border-emerald-500/30 text-emerald-200 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm sm:text-base text-white">Pensado para Adultos Mayores</h2>
                  <p className="text-xs sm:text-sm text-emerald-200/80">
                    Letra grande, botones visibles y asistencia directa ante cualquier consulta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-emerald-700/50 text-xs text-emerald-200/80">
            <span>Servicio de salud digital integrado con el sistema de atención primaria rural.</span>
          </div>
        </div>

        {/* Right Column: Formulario de Acceso (Pantalla A) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 inline-block mb-2">
              Pantalla de Acceso
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ingreso a RuralMed
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Ingrese su RUT y su número de celular para consultar su ficha médica.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No fue posible ingresar</p>
                <p className="text-xs sm:text-sm text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo 1: RUT */}
            <div>
              <label htmlFor="rut" className="block text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                1. RUT del Paciente <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <input
                  id="rut"
                  type="text"
                  required
                  value={rut}
                  onChange={handleRutChange}
                  placeholder="Ej: 12.345.678-9"
                  maxLength={12}
                  className="w-full min-h-[52px] pl-11 pr-4 rounded-xl border-2 border-slate-300 text-slate-900 text-base sm:text-lg font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                  autoComplete="username"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                <span>Escriba su RUT con o sin puntos (ejemplo: 15.420.312-8 o 15420312-8).</span>
              </p>
            </div>

            {/* Campo 2: Número de Celular */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="celular" className="block text-sm sm:text-base font-bold text-slate-900">
                  2. Número de Celular <span className="text-rose-600">*</span>
                </label>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Contraseña de acceso
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  id="celular"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={celular}
                  onChange={handleCelularChange}
                  placeholder="Ej: +56 9 8765 4321 o 987654321"
                  className="w-full min-h-[52px] pl-11 pr-12 rounded-xl border-2 border-slate-300 text-slate-900 text-base sm:text-lg font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar número de celular' : 'Mostrar número de celular'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Su número de teléfono actúa como su clave de seguridad para que nunca la olvide.
              </p>
            </div>

            {/* Botón Principal: Ingresar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[54px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base sm:text-lg shadow-lg shadow-emerald-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Consultando ficha en RuralMed...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 stroke-[2.5]" />
                    <span>Ingresar a mi Ficha</span>
                  </>
                )}
              </button>
            </div>

            {/* Separador */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-semibold">
                  ¿Es su primera vez en RuralMed?
                </span>
              </div>
            </div>

            {/* Botón Secundario: Registrar / Nuevo Usuario */}
            <div>
              <button
                type="button"
                onClick={onGoToRegister}
                className="w-full min-h-[50px] rounded-2xl bg-teal-50 hover:bg-teal-100 border-2 border-teal-300 text-teal-800 font-bold text-base shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <UserPlus className="w-5 h-5 stroke-[2.2] text-teal-700" />
                <span>Registrar / Nuevo Usuario</span>
              </button>
              <p className="text-xs text-center text-slate-500 mt-2">
                Cree su ficha clínica en 2 minutos para recibir atención y medicamentos.
              </p>
            </div>

          </form>

        </div>

      </div>

      {/* Rural Guidance Box */}
      <div className="mt-8 p-5 bg-white rounded-2xl border border-slate-200 text-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
            ?
          </div>
          <div>
            <p className="font-bold text-slate-900">¿Tiene dudas para ingresar?</p>
            <p className="text-xs sm:text-sm text-slate-600">
              Puede pedir ayuda a su paramédico de posta o llamar gratis al <strong>600 360 7777 (Salud Responde)</strong>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
