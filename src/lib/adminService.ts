import { supabase, Usuario } from './supabase.ts';
import { FUNCIONARIOS_PRUEBA, PROFESIONALES } from './clinicData.ts';
import { deleteCitasByPaciente, deleteCitasByProfesional } from './appointmentsService.ts';

export type RolFuncionario = 'Médico' | 'Kinesiólogo' | 'Administrativo';

export interface FuncionarioRecord {
  id: string;
  rut: string;
  nombre: string;
  email: string;
  password: string;
  rol: RolFuncionario;
  especialidad: string;
  profesionalId?: string;
  source?: 'supabase' | 'local';
}

export const ESPECIALIDADES_FUNCIONARIO: string[] = [
  'Médico General / Consulta',
  'Kinesiología',
  'Control Cardiovascular y Crónico',
  'Ronda Médica General',
  'Enfermería y Curaciones',
  'Control Dental Rural',
  'Toma de Muestras y Exámenes',
  'Gestión y Administración de Posta',
];

const STAFF_STORAGE_KEY = 'ruralmed_funcionarios_admin_v1';

function buildInitialStaffSeed(): FuncionarioRecord[] {
  const list: FuncionarioRecord[] = [
    {
      id: 'func-alejandro',
      rut: '14.520.890-3',
      nombre: 'Dr. Alejandro Morales Fuentes',
      email: 'alejandro.morales@ruralmed.cl',
      password: 'ruralmed2026',
      rol: 'Médico',
      especialidad: 'Médico General / Consulta',
      profesionalId: 'prof-alejandro-morales',
      source: 'local',
    },
    {
      id: 'func-daniela',
      rut: '15.812.334-5',
      nombre: 'Dra. Daniela Rojas Paredes',
      email: 'daniela.rojas@ruralmed.cl',
      password: 'ruralmed2026',
      rol: 'Médico',
      especialidad: 'Control Cardiovascular y Crónico',
      profesionalId: 'prof-daniela-rojas',
      source: 'local',
    },
    {
      id: 'func-javier',
      rut: '17.245.901-2',
      nombre: 'Klgo. Javier Soto Valenzuela',
      email: 'javier.soto@ruralmed.cl',
      password: 'ruralmed2026',
      rol: 'Kinesiólogo',
      especialidad: 'Kinesiología',
      profesionalId: 'prof-javier-soto',
      source: 'local',
    },
    {
      id: 'func-admin',
      rut: '16.890.432-1',
      nombre: 'Camila Herrera Lagos',
      email: 'admin@ruralmed.cl',
      password: 'admin2026',
      rol: 'Administrativo',
      especialidad: 'Gestión y Administración de Posta',
      source: 'local',
    },
  ];
  return list;
}

function loadLocalStaff(): FuncionarioRecord[] {
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) {
      const seed = buildInitialStaffSeed();
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as FuncionarioRecord[];
    return Array.isArray(parsed) ? parsed : buildInitialStaffSeed();
  } catch {
    return buildInitialStaffSeed();
  }
}

function saveLocalStaff(records: FuncionarioRecord[]) {
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('No se pudo guardar funcionarios en localStorage', e);
  }
}

/**
 * Fetch all funcionarios from Supabase `funcionarios` table merged with local store
 */
export async function fetchFuncionarios(): Promise<FuncionarioRecord[]> {
  const localRecords = loadLocalStaff();

  try {
    const { data, error } = await supabase.from('funcionarios').select('*');
    if (!error && data && data.length > 0) {
      const dbMapped: FuncionarioRecord[] = data.map((row: Record<string, unknown>, idx: number) => ({
        id: String(row.funcionario_id || row.id || `db-func-${idx}`),
        rut: String(row.rut || ''),
        nombre: String(row.nombre || row.nombre_completo || ''),
        email: String(row.email || row.correo || ''),
        password: String(row.password || row.contrasena || ''),
        rol: (row.rol === 'Kinesiólogo' || row.rol === 'Administrativo' ? row.rol : 'Médico') as RolFuncionario,
        especialidad: String(row.especialidad || 'Médico General / Consulta'),
        profesionalId: row.profesional_id ? String(row.profesional_id) : undefined,
        source: 'supabase',
      }));

      // Merge avoiding duplicates by RUT or email
      const seenRuts = new Set(dbMapped.map((r) => r.rut.replace(/\./g, '').toUpperCase()));
      const merged = [
        ...dbMapped,
        ...localRecords.filter((l) => !seenRuts.has(l.rut.replace(/\./g, '').toUpperCase())),
      ];
      return merged;
    }
  } catch {
    // Fallback to local records
  }

  return localRecords;
}

/**
 * Create a new Doctor / Funcionario in Supabase `funcionarios` and sync locally
 */
export async function createFuncionario(
  input: Omit<FuncionarioRecord, 'id' | 'source'>
): Promise<{ success: boolean; record?: FuncionarioRecord; error?: string; syncedToSupabase: boolean }> {
  const current = await fetchFuncionarios();
  const cleanNewRut = input.rut.replace(/\./g, '').toUpperCase();
  const cleanNewEmail = input.email.trim().toLowerCase();

  if (current.some((f) => f.rut.replace(/\./g, '').toUpperCase() === cleanNewRut)) {
    return { success: false, error: 'Ya existe un profesional o funcionario registrado con ese RUT.', syncedToSupabase: false };
  }
  if (current.some((f) => f.email.trim().toLowerCase() === cleanNewEmail)) {
    return { success: false, error: 'Ya existe un registro con ese correo institucional.', syncedToSupabase: false };
  }

  const newProfId = `prof-${Date.now()}`;
  const newRecord: FuncionarioRecord = {
    ...input,
    email: cleanNewEmail,
    id: `func-${Date.now()}`,
    profesionalId: input.rol !== 'Administrativo' ? newProfId : undefined,
    source: 'local',
  };

  let syncedToSupabase = false;

  // Attempt insert into Supabase `funcionarios` table
  try {
    const { data, error } = await supabase
      .from('funcionarios')
      .insert([
        {
          rut: newRecord.rut,
          nombre: newRecord.nombre,
          email: newRecord.email,
          password: newRecord.password,
          rol: newRecord.rol,
          especialidad: newRecord.especialidad,
        },
      ])
      .select();

    if (!error && data && data.length > 0) {
      syncedToSupabase = true;
      newRecord.source = 'supabase';
      newRecord.id = String(data[0].funcionario_id || data[0].id || newRecord.id);
    }
  } catch {
    // Graceful fallback if RLS restricts anonymous insert on funcionarios
  }

  const localCurrent = loadLocalStaff();
  saveLocalStaff([newRecord, ...localCurrent]);

  // Also register in runtime PROFESIONALES & FUNCIONARIOS_PRUEBA so booking & login work immediately
  if (input.rol !== 'Administrativo') {
    const mappedEsp =
      input.especialidad === 'Médico General / Consulta' ? 'Médico General' : input.especialidad;
    if (!PROFESIONALES.some((p) => p.nombre === newRecord.nombre)) {
      PROFESIONALES.push({
        id: newRecord.profesionalId || newProfId,
        nombre: newRecord.nombre,
        titulo: input.rol,
        especialidades: [mappedEsp, input.especialidad],
        box: 'Box Rural Asignado',
        diasAtencion: [1, 2, 3, 4, 5],
        horarios: ['09:00', '10:00', '11:00', '14:30', '15:30'],
        indicaciones: 'Presentarse 15 minutos antes con cédula de identidad.',
      });
    }
  }

  if (!FUNCIONARIOS_PRUEBA.some((f) => f.email.toLowerCase() === newRecord.email)) {
    FUNCIONARIOS_PRUEBA.push({
      id: newRecord.id,
      rut: newRecord.rut,
      email: newRecord.email,
      password: newRecord.password,
      nombre: newRecord.nombre,
      cargo: input.rol === 'Administrativo' ? 'Administrativo de Posta' : input.especialidad,
      rol: input.rol === 'Administrativo' ? 'admin' : 'doctor',
      profesionalId: newRecord.profesionalId,
      posta: 'Posta de Salud Rural',
    });
  }

  return { success: true, record: newRecord, syncedToSupabase };
}

/**
 * Delete a Doctor / Funcionario from Supabase `funcionarios`, local store, and cascade-delete associated appointments
 */
export async function deleteFuncionario(record: FuncionarioRecord): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('funcionarios').delete().eq('rut', record.rut);
  } catch {
    // ignore RLS errors on Supabase
  }

  // Cascade delete associated appointments
  await deleteCitasByProfesional(record.profesionalId || record.id, record.nombre);

  // Remove from local store
  const localCurrent = loadLocalStaff();
  const updated = localCurrent.filter(
    (f) => f.id !== record.id && f.rut.replace(/\./g, '').toUpperCase() !== record.rut.replace(/\./g, '').toUpperCase()
  );
  saveLocalStaff(updated);

  return { success: true };
}

/**
 * Fetch all patients directly from Supabase `usuarios` table
 */
export async function fetchPacientes(): Promise<{ data: Usuario[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data || []) as Usuario[] };
  } catch (err: unknown) {
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Error al consultar pacientes en Supabase.',
    };
  }
}

/**
 * Create a new Patient directly in Supabase `usuarios` table
 */
export async function createPaciente(
  nuevoUsuario: Usuario
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('usuarios').insert([nuevoUsuario]).select();
    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('rut')) {
          return { success: false, error: 'Este RUT ya se encuentra registrado en la base de datos.' };
        }
        if (error.message.includes('email')) {
          return { success: false, error: 'Este correo electrónico ya está registrado.' };
        }
      }
      return { success: false, error: error.message || 'No se pudo registrar el paciente.' };
    }
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión al crear paciente.',
    };
  }
}

/**
 * Delete a Patient from Supabase `usuarios` table and remove their associated appointments
 */
export async function deletePaciente(paciente: Usuario): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('usuarios').delete().eq('rut', paciente.rut);
    if (error) {
      return {
        success: false,
        error: `No se pudo eliminar en Supabase: ${error.message}`,
      };
    }
    await deleteCitasByPaciente(paciente.rut);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar paciente.',
    };
  }
}
