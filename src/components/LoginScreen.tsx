import React, { useState } from 'react';
import { supabase, formatRUT, Usuario } from '../lib/supabase.ts';
import { Funcionario, FUNCIONARIOS_PRUEBA } from '../lib/clinicData.ts';
import { fetchFuncionarios } from '../lib/adminService.ts';
import { RURALMED_LOGO_URL } from './Header.tsx';
import {
  LogIn,
  UserPlus,
  Phone,
  CreditCard,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Stethoscope,
  User,
  Lock,
  Mail,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (usuario: Usuario) => void;
  onStaffLoginSuccess: (funcionario: Funcionario) => void;
  onAdminLoginSuccess: (admin: Funcionario) => void;
  onGoToRegister: () => void;
  initialMessage?: string | null;
  heroImage?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onStaffLoginSuccess,
  onAdminLoginSuccess,
  onGoToRegister,
  initialMessage,
}) => {
  const [loginRole, setLoginRole] = useState<'paciente' | 'funcionario' | 'administrativo'>('paciente');

  // Patient login states
  const [rut, setRut] = useState('');
  const [celular, setCelular] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Staff / Admin login states
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (role: 'paciente' | 'funcionario' | 'administrativo') => {
    setLoginRole(role);
    setErrorMessage(null);
    setStaffIdentifier('');
    setStaffPassword('');
  };

  // Handle RUT input formatting for patient
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

  const handlePatientSubmit = async (e: React.FormEvent) => {
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
      let { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rut', cleanRutVal)
        .eq('celular', cleanCelVal);

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

  const handleInstitutionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idTrimmed = staffIdentifier.trim();
    const passTrimmed = staffPassword.trim();

    if (!idTrimmed || !passTrimmed) {
      setErrorMessage('Por favor ingrese su RUT o correo institucional y su contraseña.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const normalizedInput = idTrimmed.toLowerCase();
      const normalizedRutInput = idTrimmed.replace(/\./g, '').toUpperCase();

      // 1. Check Supabase + Admin-managed funcionarios
      const allStaff = await fetchFuncionarios();
      const matchedManaged = allStaff.find((f) => {
        const emailMatch = f.email.toLowerCase() === normalizedInput;
        const rutMatch = f.rut.replace(/\./g, '').toUpperCase() === normalizedRutInput;
        return (emailMatch || rutMatch) && f.password === passTrimmed;
      });

      let resolvedUser: Funcionario | null = null;

      if (matchedManaged) {
        resolvedUser = {
          id: matchedManaged.id,
          rut: matchedManaged.rut,
          email: matchedManaged.email,
          password: '',
          nombre: matchedManaged.nombre,
          cargo:
            matchedManaged.rol === 'Administrativo'
              ? 'Administrativo de Posta Rural'
              : matchedManaged.especialidad,
          rol: matchedManaged.rol === 'Administrativo' ? 'admin' : 'doctor',
          profesionalId: matchedManaged.profesionalId,
          posta: 'Posta de Salud Rural',
        };
      } else {
        const matchedSeed = FUNCIONARIOS_PRUEBA.find((f) => {
          const emailMatch = f.email.toLowerCase() === normalizedInput;
          const rutMatch = f.rut.replace(/\./g, '').toUpperCase() === normalizedRutInput;
          return (emailMatch || rutMatch) && f.password === passTrimmed;
        });
        if (matchedSeed) resolvedUser = matchedSeed;
      }

      if (!resolvedUser) {
        setErrorMessage(
          'Credenciales institucionales incorrectas. Verifique su RUT/correo y contraseña o utilice la cuenta de prueba.'
        );
        return;
      }

      if (loginRole === 'administrativo') {
        if (resolvedUser.rol !== 'admin') {
          setErrorMessage(
            'Esta cuenta corresponde a un profesional de salud. Para el Panel Administrativo ingrese con un usuario de rol Administrativo.'
          );
          return;
        }
        onAdminLoginSuccess(resolvedUser);
      } else {
        onStaffLoginSuccess(resolvedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyTestAccount = (account: Funcionario) => {
    setStaffIdentifier(account.email);
    setStaffPassword(account.password);
    setErrorMessage(null);
  };

  const doctorTestAccounts = FUNCIONARIOS_PRUEBA.filter((f) => f.rol === 'doctor');
  const adminTestAccounts = FUNCIONARIOS_PRUEBA.filter((f) => f.rol === 'admin');

  return (
    <div className="w-full max-w-lg mx-auto py-8 sm:py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      {/* Central Official RuralMed Logo */}
      <div className="text-center mb-6 flex flex-col items-center">
        <img
          src={RURALMED_LOGO_URL}
          alt="RuralMed"
          className="w-[150px] h-auto object-contain rounded-2xl mix-blend-multiply"
        />
      </div>

      {/* Informational Notification if redirected after registration */}
      {initialMessage && loginRole === 'paciente' && (
        <div className="w-full mb-5 p-4 rounded-2xl bg-sky-50 border border-sky-300 text-sky-900 flex items-center gap-3 shadow-xs animate-in fade-in">
          <ShieldCheck className="w-6 h-6 text-sky-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">¡Registro guardado con éxito!</p>
            <p className="text-xs sm:text-sm mt-0.5">{initialMessage}</p>
          </div>
        </div>
      )}

      {/* Main Clean Form Card */}
      <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-5 sm:p-8">
        {/* 3 Access Tabs: Paciente / Funcionario / Administrativo */}
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-slate-100 rounded-2xl mb-6 border border-slate-200/70">
          <button
            type="button"
            onClick={() => handleRoleChange('paciente')}
            className={`min-h-[46px] px-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              loginRole === 'paciente'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Paciente</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('funcionario')}
            className={`min-h-[46px] px-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              loginRole === 'funcionario'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span>Funcionario</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('administrativo')}
            className={`min-h-[46px] px-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              loginRole === 'administrativo'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Admin</span>
          </button>
        </div>

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">No fue posible ingresar</p>
              <p className="text-xs sm:text-sm text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* TAB 1: PACIENTE */}
        {loginRole === 'paciente' && (
          <form onSubmit={handlePatientSubmit} className="space-y-5">
            <div>
              <label htmlFor="rut" className="block text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                RUT <span className="text-rose-600">*</span>
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
                  className="w-full min-h-[52px] pl-11 pr-4 rounded-xl border-2 border-slate-300 text-slate-900 text-base sm:text-lg font-medium focus:border-sky-600 focus:ring-2 focus:ring-sky-200 transition-colors placeholder:text-slate-400 bg-white"
                  autoComplete="username"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Ingrese su RUT con o sin puntos.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="celular" className="block text-sm sm:text-base font-bold text-slate-900">
                  Número de Celular <span className="text-rose-600">*</span>
                </label>
                <span className="text-xs font-semibold text-sky-700">
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
                  className="w-full min-h-[52px] pl-11 pr-12 rounded-xl border-2 border-slate-300 text-slate-900 text-base sm:text-lg font-medium focus:border-sky-600 focus:ring-2 focus:ring-sky-200 transition-colors placeholder:text-slate-400 bg-white"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar número de celular' : 'Mostrar número de celular'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Su celular registrado es su clave de acceso.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[54px] rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base sm:text-lg shadow-lg shadow-sky-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 stroke-[2.5]" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-semibold">o</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={onGoToRegister}
                className="w-full min-h-[52px] rounded-2xl bg-cyan-50 hover:bg-cyan-100 border-2 border-cyan-300 text-cyan-800 font-bold text-base shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <UserPlus className="w-5 h-5 stroke-[2.2] text-cyan-700" />
                <span>Registrar / Nuevo Usuario</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2 & 3: FUNCIONARIO / PANEL ADMINISTRATIVO */}
        {(loginRole === 'funcionario' || loginRole === 'administrativo') && (
          <form onSubmit={handleInstitutionalSubmit} className="space-y-5">
            <div className="pb-1">
              <h2 className="text-lg font-extrabold text-slate-900">
                {loginRole === 'administrativo'
                  ? 'Acceso Panel Administrativo'
                  : 'Acceso Equipo de Salud'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {loginRole === 'administrativo'
                  ? 'Gestión de doctores, funcionarios y pacientes registrados.'
                  : 'Agenda de citas médicas y reportes de atención.'}
              </p>
            </div>

            <div>
              <label htmlFor="staff-id" className="block text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                RUT o Correo Institucional <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="staff-id"
                  type="text"
                  required
                  value={staffIdentifier}
                  onChange={(e) => {
                    setStaffIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={
                    loginRole === 'administrativo'
                      ? 'Ej: admin@ruralmed.cl o 16.890.432-1'
                      : 'Ej: alejandro.morales@ruralmed.cl o 14.520.890-3'
                  }
                  className="w-full min-h-[52px] pl-11 pr-4 rounded-xl border-2 border-slate-300 text-slate-900 text-base font-medium focus:border-sky-600 focus:ring-2 focus:ring-sky-200 transition-colors placeholder:text-slate-400 bg-white"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="staff-password" className="block text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                Contraseña <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="staff-password"
                  type={showStaffPassword ? 'text' : 'password'}
                  required
                  value={staffPassword}
                  onChange={(e) => {
                    setStaffPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Ingrese su contraseña"
                  className="w-full min-h-[52px] pl-11 pr-12 rounded-xl border-2 border-slate-300 text-slate-900 text-base font-medium focus:border-sky-600 focus:ring-2 focus:ring-sky-200 transition-colors placeholder:text-slate-400 bg-white"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPassword(!showStaffPassword)}
                  aria-label={showStaffPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showStaffPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[54px] rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-base sm:text-lg shadow-lg shadow-sky-800/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loginRole === 'administrativo' ? (
                  <>
                    <ShieldCheck className="w-5 h-5 stroke-[2.3]" />
                    <span>Ingresar al Panel Administrativo</span>
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-5 h-5 stroke-[2.3]" />
                    <span>Ingresar al Panel de Salud</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Credentials Helper scoped to selected tab */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-600 mb-2.5">
                Cuenta de acceso rápido para pruebas:
              </p>
              <div className="space-y-2">
                {(loginRole === 'administrativo' ? adminTestAccounts : doctorTestAccounts).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => applyTestAccount(acc)}
                    className="w-full text-left p-3 rounded-xl bg-sky-50/70 hover:bg-sky-100/70 border border-sky-200/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-sky-950">
                        {acc.nombre}
                      </span>
                      <span className="text-[11px] font-semibold text-sky-700">
                        {acc.rol === 'admin' ? 'Administrativo' : 'Médico'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                      {acc.email} · Clave: {acc.password}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
