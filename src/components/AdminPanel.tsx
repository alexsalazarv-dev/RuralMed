import React, { useState, useEffect, useMemo } from 'react';
import { Usuario, FuncionarioDB, formatRUT } from '../lib/supabase.ts';
import {
  RolFuncionario,
  ESPECIALIDADES_FUNCIONARIO,
  fetchAllFuncionarios,
  createFuncionario,
  deleteFuncionario,
  fetchPacientes,
  createPaciente,
  deletePaciente,
} from '../lib/adminService.ts';
import {
  Search,
  UserPlus,
  Trash2,
  Stethoscope,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

interface AdminPanelProps {
  onDataChanged?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onDataChanged }) => {
  const [subTab, setSubTab] = useState<'funcionarios' | 'pacientes'>('funcionarios');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states directly from Supabase
  const [funcionarios, setFuncionarios] = useState<FuncionarioDB[]>([]);
  const [pacientes, setPacientes] = useState<Usuario[]>([]);
  const [loadingFunc, setLoadingFunc] = useState(true);
  const [loadingPac, setLoadingPac] = useState(true);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals: Create
  const [showAddFuncModal, setShowAddFuncModal] = useState(false);
  const [showAddPacModal, setShowAddPacModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modals: Delete confirmation
  const [funcToDelete, setFuncToDelete] = useState<FuncionarioDB | null>(null);
  const [pacToDelete, setPacToDelete] = useState<Usuario | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state: New Doctor / Funcionario
  const [funcForm, setFuncForm] = useState({
    rut: '',
    nombre_completo: '',
    email: '',
    password: '',
    rol: 'Médico' as RolFuncionario,
    especialidad: ESPECIALIDADES_FUNCIONARIO[0],
  });

  // Form state: New Patient (8 exact fields)
  const [pacForm, setPacForm] = useState({
    rut: '',
    nombre: '',
    apellidos: '',
    fecha_nacimiento: '',
    email: '',
    celular: '',
    direccion: '',
    ciudad: '',
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const loadFuncionariosList = async () => {
    setLoadingFunc(true);
    const res = await fetchAllFuncionarios();
    if (res.error) {
      showNotification('error', `Error al cargar funcionarios: ${res.error}`);
    }
    setFuncionarios(res.data);
    setLoadingFunc(false);
  };

  const loadPacientesList = async () => {
    setLoadingPac(true);
    const res = await fetchPacientes();
    if (res.error) {
      showNotification('error', `Error al cargar pacientes: ${res.error}`);
    }
    setPacientes(res.data);
    setLoadingPac(false);
  };

  useEffect(() => {
    loadFuncionariosList();
    loadPacientesList();
  }, []);

  const filteredFuncionarios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const qClean = q.replace(/\./g, '');
    if (!q) return funcionarios;
    return funcionarios.filter((f) => {
      const rutClean = f.rut.replace(/\./g, '').toLowerCase();
      return (
        f.nombre_completo.toLowerCase().includes(q) ||
        f.rut.toLowerCase().includes(q) ||
        rutClean.includes(qClean) ||
        f.email.toLowerCase().includes(q)
      );
    });
  }, [funcionarios, searchQuery]);

  const filteredPacientes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const qClean = q.replace(/\./g, '');
    if (!q) return pacientes;
    return pacientes.filter((p) => {
      const fullName = `${p.nombre} ${p.apellidos}`.toLowerCase();
      const rutClean = p.rut.replace(/\./g, '').toLowerCase();
      return (
        fullName.includes(q) ||
        p.rut.toLowerCase().includes(q) ||
        rutClean.includes(qClean) ||
        p.ciudad.toLowerCase().includes(q)
      );
    });
  }, [pacientes, searchQuery]);

  const handleAddFuncionarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const res = await createFuncionario({
        rut: funcForm.rut.trim(),
        nombre_completo: funcForm.nombre_completo.trim(),
        email: funcForm.email.trim().toLowerCase(),
        password: funcForm.password.trim(),
        rol: funcForm.rol,
        especialidad: funcForm.especialidad,
      });

      if (!res.success) {
        setModalError(res.error || 'No se pudo agregar el funcionario.');
        return;
      }

      await loadFuncionariosList();
      onDataChanged?.();
      setShowAddFuncModal(false);
      setFuncForm({
        rut: '',
        nombre_completo: '',
        email: '',
        password: '',
        rol: 'Médico',
        especialidad: ESPECIALIDADES_FUNCIONARIO[0],
      });
      showNotification(
        'success',
        funcForm.rol === 'Administrativo'
          ? 'Funcionario agregado correctamente'
          : 'Doctor agregado correctamente'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeleteFunc = async () => {
    if (!funcToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteFuncionario(funcToDelete.funcionario_id);
      if (res.success) {
        await loadFuncionariosList();
        onDataChanged?.();
        showNotification('success', 'Profesional y citas asociadas eliminados correctamente');
      } else {
        showNotification('error', res.error || 'No se pudo eliminar el profesional.');
      }
    } finally {
      setDeleting(false);
      setFuncToDelete(null);
    }
  };

  const handleAddPacienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const res = await createPaciente({
        rut: pacForm.rut.trim(),
        nombre: pacForm.nombre.trim(),
        apellidos: pacForm.apellidos.trim(),
        fecha_nacimiento: pacForm.fecha_nacimiento,
        email: pacForm.email.trim().toLowerCase(),
        celular: pacForm.celular.trim(),
        direccion: pacForm.direccion.trim(),
        ciudad: pacForm.ciudad.trim(),
      });

      if (!res.success) {
        setModalError(res.error || 'No se pudo registrar el paciente.');
        return;
      }

      await loadPacientesList();
      setShowAddPacModal(false);
      setPacForm({
        rut: '',
        nombre: '',
        apellidos: '',
        fecha_nacimiento: '',
        email: '',
        celular: '',
        direccion: '',
        ciudad: '',
      });
      showNotification('success', 'Paciente agregado correctamente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeletePac = async () => {
    if (!pacToDelete) return;
    setDeleting(true);
    try {
      const res = await deletePaciente(pacToDelete);
      if (res.success) {
        await loadPacientesList();
        onDataChanged?.();
        showNotification('success', 'Paciente eliminado correctamente');
      } else {
        showNotification('error', res.error || 'No se pudo eliminar el paciente.');
      }
    } finally {
      setDeleting(false);
      setPacToDelete(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-sm animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-sky-50 border-sky-300 text-sky-950'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-bold">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Bar: Sub-tabs + Quick Search */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:inline-flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setSubTab('funcionarios')}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                subTab === 'funcionarios'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4 shrink-0" />
              <span>Doctores y Funcionarios ({funcionarios.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('pacientes')}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                subTab === 'pacientes'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Pacientes ({pacientes.length})</span>
            </button>
          </div>

          {subTab === 'funcionarios' ? (
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setShowAddFuncModal(true);
              }}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>+ Agregar Doctor / Funcionario</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setShowAddPacModal(true);
              }}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>+ Agregar Paciente</span>
            </button>
          )}
        </div>

        {/* Quick Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                subTab === 'funcionarios'
                  ? 'Buscar profesional por RUT o Nombre...'
                  : 'Buscar paciente por RUT o Nombre...'
              }
              className="w-full min-h-[46px] pl-10 pr-10 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:border-sky-600 focus:ring-2 focus:ring-sky-200 bg-white placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => (subTab === 'funcionarios' ? loadFuncionariosList() : loadPacientesList())}
            aria-label="Actualizar listado"
            className="min-h-[46px] min-w-[46px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB 1: DOCTORES Y FUNCIONARIOS */}
      {subTab === 'funcionarios' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {loadingFunc ? (
            <div className="p-10 text-center text-slate-500 text-sm font-semibold">
              Cargando profesionales y funcionarios desde Supabase...
            </div>
          ) : filteredFuncionarios.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No se encontraron profesionales</p>
              <p className="text-xs mt-1">Intente con otro RUT o nombre, o agregue un nuevo registro.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-sky-50/50 text-xs font-bold text-slate-600">
                      <th className="py-3.5 px-5">Nombre Completo</th>
                      <th className="py-3.5 px-4">RUT</th>
                      <th className="py-3.5 px-4">Rol</th>
                      <th className="py-3.5 px-4">Especialidad</th>
                      <th className="py-3.5 px-4">Correo Institucional</th>
                      <th className="py-3.5 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredFuncionarios.map((f) => (
                      <tr key={f.funcionario_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-900">{f.nombre_completo}</td>
                        <td className="py-4 px-4 font-medium text-slate-700 tabular-nums whitespace-nowrap">
                          {f.rut}
                        </td>
                        <td className="py-4 px-4 font-semibold text-sky-800 whitespace-nowrap">
                          {f.rol}
                        </td>
                        <td className="py-4 px-4 text-slate-700">{f.especialidad}</td>
                        <td className="py-4 px-4 text-slate-600">{f.email}</td>
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => setFuncToDelete(f)}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredFuncionarios.map((f) => (
                  <div key={f.funcionario_id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{f.nombre_completo}</h3>
                        <p className="text-xs font-semibold text-sky-700 mt-0.5">
                          {f.rol} · {f.especialidad}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFuncToDelete(f)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="tabular-nums">
                        RUT: <strong className="text-slate-800">{f.rut}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{f.email}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: PACIENTES (Supabase tabla `usuarios`) */}
      {subTab === 'pacientes' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {loadingPac ? (
            <div className="p-10 text-center text-slate-500 text-sm font-semibold">
              Consultando pacientes registrados en Supabase...
            </div>
          ) : filteredPacientes.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No se encontraron pacientes</p>
              <p className="text-xs mt-1">
                Pruebe limpiando el buscador o presione &quot;+ Agregar Paciente&quot;.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-sky-50/50 text-xs font-bold text-slate-600">
                      <th className="py-3.5 px-5">Nombre y Apellidos</th>
                      <th className="py-3.5 px-4">RUT</th>
                      <th className="py-3.5 px-4">Celular</th>
                      <th className="py-3.5 px-4">Ciudad</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredPacientes.map((p) => (
                      <tr key={p.rut} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-900">
                          {p.nombre} {p.apellidos}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-700 tabular-nums whitespace-nowrap">
                          {p.rut}
                        </td>
                        <td className="py-4 px-4 text-slate-700 tabular-nums whitespace-nowrap">
                          {p.celular}
                        </td>
                        <td className="py-4 px-4 text-slate-700">{p.ciudad}</td>
                        <td className="py-4 px-4 text-slate-600">{p.email}</td>
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => setPacToDelete(p)}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredPacientes.map((p) => (
                  <div key={p.rut} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {p.nombre} {p.apellidos}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5 tabular-nums">
                          RUT: <strong>{p.rut}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPacToDelete(p)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5 tabular-nums">
                        <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{p.celular}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{p.ciudad}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL: AGREGAR DOCTOR / FUNCIONARIO */}
      {showAddFuncModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-func-title"
          >
            <button
              type="button"
              onClick={() => setShowAddFuncModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 id="add-func-title" className="text-xl font-extrabold text-slate-900 pr-8">
              Agregar Doctor / Funcionario
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              El registro se guardará directamente en la tabla funcionarios de Supabase.
            </p>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddFuncionarioSubmit} className="mt-5 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RUT <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="Ej: 15.432.198-7"
                    value={funcForm.rut}
                    onChange={(e) => setFuncForm((p) => ({ ...p, rut: formatRUT(e.target.value) }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rol <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={funcForm.rol}
                    onChange={(e) => {
                      const nextRol = e.target.value as RolFuncionario;
                      setFuncForm((p) => ({
                        ...p,
                        rol: nextRol,
                        especialidad:
                          nextRol === 'Kinesiólogo'
                            ? 'Kinesiología'
                            : nextRol === 'Administrativo'
                            ? 'Ronda Médica General'
                            : 'Médico General / Consulta',
                      }));
                    }}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-semibold bg-white focus:border-sky-600"
                  >
                    <option value="Médico">Médico</option>
                    <option value="Kinesiólogo">Kinesiólogo</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dra. Sofía Valdés Contreras"
                  value={funcForm.nombre_completo}
                  onChange={(e) => setFuncForm((p) => ({ ...p, nombre_completo: e.target.value }))}
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Especialidad <span className="text-rose-600">*</span>
                </label>
                <select
                  value={funcForm.especialidad}
                  onChange={(e) => setFuncForm((p) => ({ ...p, especialidad: e.target.value }))}
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-semibold bg-white focus:border-sky-600"
                >
                  {ESPECIALIDADES_FUNCIONARIO.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Institucional (Email) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nombre@ruralmed.cl"
                    value={funcForm.email}
                    onChange={(e) => setFuncForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contraseña de acceso <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    placeholder="Mínimo 4 caracteres"
                    value={funcForm.password}
                    onChange={(e) => setFuncForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddFuncModal(false)}
                  className="min-h-[46px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[46px] px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Guardar Funcionario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR PACIENTE (8 campos exactos) */}
      {showAddPacModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-pac-title"
          >
            <button
              type="button"
              onClick={() => setShowAddPacModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 id="add-pac-title" className="text-xl font-extrabold text-slate-900 pr-8">
              Agregar Nuevo Paciente
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              El paciente se guardará directamente en la tabla de usuarios de Supabase.
            </p>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddPacienteSubmit} className="mt-5 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RUT <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="Ej: 12.345.678-9"
                    value={pacForm.rut}
                    onChange={(e) => setPacForm((p) => ({ ...p, rut: formatRUT(e.target.value) }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Nacimiento <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={pacForm.fecha_nacimiento}
                    onChange={(e) => setPacForm((p) => ({ ...p, fecha_nacimiento: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: María José"
                    value={pacForm.nombre}
                    onChange={(e) => setPacForm((p) => ({ ...p, nombre: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apellidos <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pérez Soto"
                    value={pacForm.apellidos}
                    onChange={(e) => setPacForm((p) => ({ ...p, apellidos: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="paciente@correo.cl"
                    value={pacForm.email}
                    onChange={(e) => setPacForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Celular (Clave) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: +56987654321"
                    value={pacForm.celular}
                    onChange={(e) => setPacForm((p) => ({ ...p, celular: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Camino Real Parcela 14"
                    value={pacForm.direccion}
                    onChange={(e) => setPacForm((p) => ({ ...p, direccion: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ciudad <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Melipilla"
                    value={pacForm.ciudad}
                    onChange={(e) => setPacForm((p) => ({ ...p, ciudad: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddPacModal(false)}
                  className="min-h-[46px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[46px] px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN: ELIMINAR FUNCIONARIO */}
      {funcToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Eliminar Profesional</h3>
                <p className="text-sm text-slate-600 mt-1">
                  ¿Seguro que deseas eliminar este profesional? También se eliminarán sus citas asociadas.
                </p>
                <p className="text-xs font-bold text-slate-800 mt-2">
                  {funcToDelete.nombre_completo} ({funcToDelete.rut})
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setFuncToDelete(null)}
                className="min-h-[44px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDeleteFunc}
                className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer disabled:opacity-60"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN: ELIMINAR PACIENTE */}
      {pacToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Eliminar Paciente</h3>
                <p className="text-sm text-slate-600 mt-1">
                  ¿Seguro que deseas eliminar este paciente y su historial?
                </p>
                <p className="text-xs font-bold text-slate-800 mt-2">
                  {pacToDelete.nombre} {pacToDelete.apellidos} ({pacToDelete.rut})
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPacToDelete(null)}
                className="min-h-[44px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDeletePac}
                className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer disabled:opacity-60"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
