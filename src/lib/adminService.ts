import { supabase, Usuario, FuncionarioDB } from './supabase.ts';

export type RolFuncionario = 'Médico' | 'Kinesiólogo' | 'Administrativo';

export const ESPECIALIDADES_FUNCIONARIO: string[] = [
  'Médico General / Consulta',
  'Kinesiología',
  'Control Cardiovascular y Crónico',
  'Ronda Médica General',
];

/**
 * Fetch all funcionarios directly from Supabase `funcionarios`
 */
export async function fetchAllFuncionarios(): Promise<{
  data: FuncionarioDB[];
  error?: string;
}> {
  const { data, error } = await supabase
    .from('funcionarios')
    .select('*')
    .order('funcionario_id', { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: (data || []) as FuncionarioDB[] };
}

/**
 * Insert a new Doctor / Funcionario directly into Supabase `funcionarios`
 */
export async function createFuncionario(input: {
  rut: string;
  nombre_completo: string;
  email: string;
  password: string;
  rol: RolFuncionario;
  especialidad: string;
}): Promise<{ success: boolean; record?: FuncionarioDB; error?: string }> {
  const { data, error } = await supabase
    .from('funcionarios')
    .insert([
      {
        rut: input.rut.trim(),
        nombre_completo: input.nombre_completo.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password.trim(),
        rol: input.rol,
        especialidad: input.especialidad,
        activo: true,
      },
    ])
    .select();

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        error: 'Ya existe un profesional o funcionario registrado con ese RUT o correo.',
      };
    }
    return {
      success: false,
      error: error.message || 'No se pudo insertar el funcionario en Supabase.',
    };
  }

  return {
    success: true,
    record: data && data.length > 0 ? (data[0] as FuncionarioDB) : undefined,
  };
}

/**
 * Delete a Doctor / Funcionario from Supabase `funcionarios` and cascade-delete associated `citas`
 */
export async function deleteFuncionario(
  funcionarioId: number
): Promise<{ success: boolean; error?: string }> {
  // Delete associated citas first to satisfy foreign key constraints
  const { error: citasErr } = await supabase
    .from('citas')
    .delete()
    .eq('funcionario_id', funcionarioId);

  if (citasErr) {
    return {
      success: false,
      error: `No se pudieron eliminar las citas asociadas: ${citasErr.message}`,
    };
  }

  const { error } = await supabase
    .from('funcionarios')
    .delete()
    .eq('funcionario_id', funcionarioId);

  if (error) {
    return {
      success: false,
      error: `No se pudo eliminar el profesional en Supabase: ${error.message}`,
    };
  }

  return { success: true };
}

/**
 * Fetch all patients directly from Supabase `usuarios`
 */
export async function fetchPacientes(): Promise<{ data: Usuario[]; error?: string }> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('fecha_registro', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: (data || []) as Usuario[] };
}

/**
 * Insert a new Patient directly into Supabase `usuarios`
 */
export async function createPaciente(
  nuevoUsuario: Usuario
): Promise<{ success: boolean; error?: string }> {
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
}

/**
 * Delete a Patient from Supabase `usuarios` and remove their associated `citas`
 */
export async function deletePaciente(
  paciente: Usuario
): Promise<{ success: boolean; error?: string }> {
  if (paciente.usuario_id) {
    const { error: citasErr } = await supabase
      .from('citas')
      .delete()
      .eq('usuario_id', paciente.usuario_id);

    if (citasErr) {
      return {
        success: false,
        error: `No se pudieron eliminar las citas del paciente: ${citasErr.message}`,
      };
    }
  }

  const { error } = await supabase.from('usuarios').delete().eq('rut', paciente.rut);
  if (error) {
    return {
      success: false,
      error: `No se pudo eliminar el paciente en Supabase: ${error.message}`,
    };
  }
  return { success: true };
}
