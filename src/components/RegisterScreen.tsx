import React, { useState } from 'react';
import { supabase, formatRUT, Usuario } from '../lib/supabase.ts';
import { ArrowLeft, UserPlus, CheckCircle2, AlertCircle, CreditCard, User, Calendar, Mail, Phone, Home, Building2, ShieldCheck, HeartPulse } from 'lucide-react';

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (registeredUser: Usuario) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBackToLogin,
  onRegisterSuccess,
}) => {
  // Exact 8 fields requested
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    apellidos: '',
    fecha_nacimiento: '',
    email: '',
    celular: '',
    direccion: '',
    ciudad: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<Usuario | null>(null);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRUT(e.target.value);
    setFormData((prev) => ({ ...prev, rut: formatted }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  // Pre-fill Chilean rural cities suggestions
  const commonCities = [
    'Curacaví',
    'Melipilla',
    'Talagante',
    'Paine',
    'Buin',
    'San Fernando',
    'Rengo',
    'Santa Cruz',
    'Curicó',
    'Molina',
    'Linares',
    'Parral',
    'Cauquenes',
    'San Carlos',
    'Chillán',
    'Quirihue',
    'Yumbel',
    'Angol',
    'Victoria',
    'Villarrica',
    'Pucón',
    'Loncoche',
    'Panguipulli',
    'La Unión',
    'Río Bueno',
    'Osorno',
    'Frutillar',
    'Puerto Varas',
    'Ancud',
    'Castro',
    'Quellón',
    'Coyhaique',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic client validation
    if (!formData.rut.trim()) {
      setErrorMessage('Por favor ingrese su RUT.');
      return;
    }
    if (!formData.nombre.trim() || !formData.apellidos.trim()) {
      setErrorMessage('Por favor complete su nombre y apellidos.');
      return;
    }
    if (!formData.fecha_nacimiento) {
      setErrorMessage('Por favor seleccione su fecha de nacimiento.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage('Por favor ingrese un correo electrónico.');
      return;
    }
    if (!formData.celular.trim()) {
      setErrorMessage('Por favor ingrese su número de celular (será su clave de ingreso).');
      return;
    }
    if (!formData.direccion.trim() || !formData.ciudad.trim()) {
      setErrorMessage('Por favor complete su dirección y ciudad/localidad.');
      return;
    }

    setLoading(true);

    try {
      const nuevoUsuario: Usuario = {
        rut: formData.rut.trim(),
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        fecha_nacimiento: formData.fecha_nacimiento,
        email: formData.email.trim().toLowerCase(),
        celular: formData.celular.trim(),
        direccion: formData.direccion.trim(),
        ciudad: formData.ciudad.trim(),
      };

      // Exact call as specified in requirement:
      // supabase.from('usuarios').insert([...])
      const { data, error } = await supabase
        .from('usuarios')
        .insert([nuevoUsuario])
        .select();

      if (error) {
        console.error('Error al insertar en Supabase:', error);
        if (error.code === '23505') {
          // Unique constraint violation (rut or email)
          if (error.message.includes('rut')) {
            setErrorMessage('Este RUT ya se encuentra registrado en RuralMed. Puede ingresar directamente desde la pantalla de Inicio.');
          } else if (error.message.includes('email')) {
            setErrorMessage('Este correo electrónico ya está registrado. Por favor use otro o ingrese en la pantalla principal.');
          } else {
            setErrorMessage('Ya existe un registro con estos datos en el sistema.');
          }
        } else {
          setErrorMessage(`No se pudo completar el registro: ${error.message || 'Error desconocido'}`);
        }
        return;
      }

      // Success!
      setSuccessData(nuevoUsuario);

      // Auto-redirect or allow user to click to login
      setTimeout(() => {
        onRegisterSuccess(nuevoUsuario);
      }, 3500);

    } catch (err: unknown) {
      console.error('Excepción al registrar usuario:', err);
      setErrorMessage('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      
      {/* Top back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBackToLogin}
          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-sm transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-700" />
          <span>Volver al Inicio / Iniciar Sesión</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-700/60 text-emerald-200">
              <HeartPulse className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-200">
              Ficha Clínica Rural
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Registro de Nuevo Usuario
          </h1>
          <p className="mt-1 text-sm sm:text-base text-emerald-100 max-w-2xl">
            Inscripción para atenciones médicas, rondas rurales, botiquín y entrega de medicamentos a domicilio.
          </p>
        </div>

        {/* Modal / Banner de Éxito al Completar el Registro */}
        {successData ? (
          <div className="p-8 sm:p-12 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ¡Registro Completado con Éxito!
            </h2>
            <p className="text-base sm:text-lg text-slate-700 mt-2 max-w-xl mx-auto">
              Bienvenido/a <strong>{successData.nombre} {successData.apellidos}</strong>. Su ficha en RuralMed ha sido creada y guardada en nuestra base de datos.
            </p>

            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-md mx-auto text-left text-sm text-emerald-900 space-y-2">
              <p className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Datos de Acceso Guardados:
              </p>
              <p>• <strong>RUT:</strong> {successData.rut}</p>
              <p>• <strong>Celular (Clave):</strong> {successData.celular}</p>
              <p className="text-xs text-emerald-700 pt-1">
                Redirigiendo a la pantalla de Inicio en unos segundos...
              </p>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => onRegisterSuccess(successData)}
                className="min-h-[50px] px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer"
              >
                Ir a Iniciar Sesión Ahora
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10">
            
            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Por favor revise los datos:</p>
                  <p className="text-xs sm:text-sm text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Bloque 1: Identificación Personal */}
              <div>
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-700" />
                  <span>1. Identificación del Paciente</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 1. RUT */}
                  <div>
                    <label htmlFor="rut" className="block text-sm font-bold text-slate-900 mb-1.5">
                      RUT <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <input
                        id="rut"
                        name="rut"
                        type="text"
                        required
                        value={formData.rut}
                        onChange={handleRutChange}
                        placeholder="Ej: 12.345.678-9"
                        maxLength={12}
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                      />
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">Con o sin puntos, con guión y dígito verificador.</span>
                  </div>

                  {/* 4. Fecha de Nacimiento */}
                  <div>
                    <label htmlFor="fecha_nacimiento" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Fecha de Nacimiento <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <input
                        id="fecha_nacimiento"
                        name="fecha_nacimiento"
                        type="date"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        min="1910-01-01"
                        value={formData.fecha_nacimiento}
                        onChange={handleChange}
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors bg-white"
                      />
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">Día / Mes / Año</span>
                  </div>

                  {/* 2. Nombre */}
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Nombre <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        id="nombre"
                        name="nombre"
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Rosa María"
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                      />
                    </div>
                  </div>

                  {/* 3. Apellidos */}
                  <div>
                    <label htmlFor="apellidos" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Apellidos <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        id="apellidos"
                        name="apellidos"
                        type="text"
                        required
                        value={formData.apellidos}
                        onChange={handleChange}
                        placeholder="Ej: Espinoza Silva"
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Contacto y Clave de Acceso */}
              <div>
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-700" />
                  <span>2. Contacto y Acceso al Sistema</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 6. Celular (Contraseña de acceso) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="celular" className="block text-sm font-bold text-slate-900">
                        Celular <span className="text-rose-600">*</span>
                      </label>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Será su contraseña
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        id="celular"
                        name="celular"
                        type="tel"
                        required
                        value={formData.celular}
                        onChange={handleChange}
                        placeholder="Ej: +56 9 8765 4321 o 987654321"
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                      />
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Número activo para avisos de rondas y recetas médicas.
                    </span>
                  </div>

                  {/* 5. Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Email (Correo Electrónico) <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Ej: rosa.espinoza@gmail.com"
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                      />
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Para envío de exámenes y recetas electrónicas.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Ubicación Rural */}
              <div>
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-emerald-700" />
                  <span>3. Domicilio y Localidad Rural</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 7. Dirección */}
                  <div>
                    <label htmlFor="direccion" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Dirección <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Home className="w-5 h-5" />
                      </div>
                      <input
                        id="direccion"
                        name="direccion"
                        type="text"
                        required
                        value={formData.direccion}
                        onChange={handleChange}
                        placeholder="Ej: Camino Real Parcela 22, Sector Los Aromos"
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                      />
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Indique sector rural, calle o número de parcela.
                    </span>
                  </div>

                  {/* 8. Ciudad */}
                  <div>
                    <label htmlFor="ciudad" className="block text-sm font-bold text-slate-900 mb-1.5">
                      Ciudad o Comuna <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <input
                        id="ciudad"
                        name="ciudad"
                        type="text"
                        required
                        list="ciudades-sugerencias"
                        value={formData.ciudad}
                        onChange={handleChange}
                        placeholder="Ej: Curacaví, Villarrica, Castro, etc."
                        className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-colors placeholder:text-slate-400 bg-white"
                      />
                      <datalist id="ciudades-sugerencias">
                        {commonCities.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Comuna a la que pertenece su posta de salud.
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón Principal "Registrar" */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[54px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base sm:text-lg shadow-lg shadow-emerald-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando su Ficha en RuralMed...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 stroke-[2.5]" />
                      <span>Registrar Nuevo Usuario</span>
                    </>
                  )}
                </button>
              </div>

              {/* Botón Volver */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-2"
                >
                  ¿Ya tiene una cuenta creada? <u>Haga clic aquí para Iniciar Sesión</u>
                </button>
              </div>

            </form>

          </div>
        )}

      </div>

    </div>
  );
};
