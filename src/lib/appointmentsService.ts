import { supabase, CitaDB, EstadoCita, FuncionarioDB } from './supabase.ts';
import {
  HORARIOS_POSTA,
  DIAS_ATENCION_POSTA,
  LUGAR_POSTA_DEFAULT,
} from './clinicData.ts';

/**
 * Format local YYYY-MM-DD date string safely without timezone drift
 */
export function toISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatFechaHumana(dateStr: string): string {
  try {
    const date = parseISODateLocal(dateStr);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * 1. Fetch active professionals from Supabase `funcionarios`
 */
export async function fetchActiveFuncionarios(
  especialidad?: string
): Promise<{ data: FuncionarioDB[]; error?: string }> {
  let query = supabase
    .from('funcionarios')
    .select('*')
    .eq('activo', true)
    .order('nombre_completo', { ascending: true });

  if (especialidad) {
    query = query.eq('especialidad', especialidad);
  }

  const { data, error } = await query;
  if (error) {
    return { data: [], error: error.message };
  }
  return { data: (data || []) as FuncionarioDB[] };
}

/**
 * 2. Fetch currently occupied appointments directly from Supabase `citas`
 */
export async function fetchOccupiedCitas(): Promise<{ data: CitaDB[]; error?: string }> {
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .in('estado', ['Confirmada', 'En Espera']);

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: (data || []) as CitaDB[] };
}

/**
 * 3. Fetch appointments for a specific patient joined with `funcionarios`
 */
export async function fetchCitasByUsuario(
  usuarioId: number
): Promise<{ data: CitaDB[]; error?: string }> {
  const { data, error } = await supabase
    .from('citas')
    .select('*, funcionarios(*)')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: (data || []) as CitaDB[] };
}

/**
 * 4. Fetch all appointments joined with `funcionarios` and `usuarios` (for Staff Portal & Reports)
 */
export async function fetchAllCitasWithRelations(): Promise<{
  data: CitaDB[];
  error?: string;
}> {
  const { data, error } = await supabase
    .from('citas')
    .select('*, funcionarios(*), usuarios(*)')
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: (data || []) as CitaDB[] };
}

/**
 * Helper: checks if a slot (funcionario_id + fecha + hora) is occupied in active citas
 */
export function isSlotOccupied(
  citas: CitaDB[],
  funcionarioId: number,
  fecha: string,
  hora: string
): boolean {
  return citas.some(
    (c) =>
      c.funcionario_id === funcionarioId &&
      c.fecha === fecha &&
      c.hora === hora &&
      (c.estado === 'Confirmada' || c.estado === 'En Espera')
  );
}

/**
 * Helper: computes day availability for a professional on a given YYYY-MM-DD date
 */
export function getDayAvailability(
  occupiedCitas: CitaDB[],
  funcionarioId: number,
  dateStr: string
): {
  status: 'past' | 'unavailable' | 'full' | 'available';
  freeSlots: number;
  totalSlots: number;
} {
  const todayStr = toISODateLocal(new Date());
  if (dateStr < todayStr) {
    return { status: 'past', freeSlots: 0, totalSlots: 0 };
  }

  const dayOfWeek = parseISODateLocal(dateStr).getDay();
  if (!DIAS_ATENCION_POSTA.includes(dayOfWeek)) {
    return { status: 'unavailable', freeSlots: 0, totalSlots: 0 };
  }

  const totalSlots = HORARIOS_POSTA.length;
  const occupiedCount = HORARIOS_POSTA.filter((h) =>
    isSlotOccupied(occupiedCitas, funcionarioId, dateStr, h)
  ).length;
  const freeSlots = Math.max(0, totalSlots - occupiedCount);

  if (freeSlots === 0) {
    return { status: 'full', freeSlots: 0, totalSlots };
  }

  return { status: 'available', freeSlots, totalSlots };
}

/**
 * 5. Insert a new appointment directly into Supabase `citas`
 * Sends exact columns: usuario_id, funcionario_id, paciente_nombre, tipo_atencion, fecha, hora, lugar, estado
 */
export async function bookAppointmentInSupabase(payload: {
  usuario_id: number;
  funcionario_id: number;
  paciente_nombre: string;
  tipo_atencion: string;
  fecha: string;
  hora: string;
  lugar?: string;
}): Promise<{ success: boolean; cita?: CitaDB; error?: string }> {
  // Real-time duplicate check against Supabase before inserting
  const { data: existing, error: checkError } = await supabase
    .from('citas')
    .select('cita_id')
    .eq('funcionario_id', payload.funcionario_id)
    .eq('fecha', payload.fecha)
    .eq('hora', payload.hora)
    .in('estado', ['Confirmada', 'En Espera']);

  if (checkError) {
    return {
      success: false,
      error: `Error al verificar disponibilidad en Supabase: ${checkError.message}`,
    };
  }

  if (existing && existing.length > 0) {
    return {
      success: false,
      error: `El bloque de las ${payload.hora} del ${payload.fecha} ya fue reservado por otro usuario. Por favor seleccione otro horario.`,
    };
  }

  const { data, error } = await supabase
    .from('citas')
    .insert([
      {
        usuario_id: payload.usuario_id,
        funcionario_id: payload.funcionario_id,
        paciente_nombre: payload.paciente_nombre,
        tipo_atencion: payload.tipo_atencion,
        fecha: payload.fecha,
        hora: payload.hora,
        lugar: payload.lugar || LUGAR_POSTA_DEFAULT,
        estado: 'Confirmada',
      },
    ])
    .select('*, funcionarios(*)');

  if (error) {
    return {
      success: false,
      error: error.message || 'No se pudo registrar la cita en Supabase.',
    };
  }

  return {
    success: true,
    cita: data && data.length > 0 ? (data[0] as CitaDB) : undefined,
  };
}

/**
 * 6. Update appointment status in Supabase (`Cancelada`, `Atendida`, etc.)
 */
export async function updateCitaEstadoInSupabase(
  citaId: number,
  nuevoEstado: EstadoCita
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('citas')
    .update({ estado: nuevoEstado })
    .eq('cita_id', citaId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * 7. Real-time statistics calculated directly from Supabase `citas` and `funcionarios`
 */
export function calculateStatsForRange(
  citas: CitaDB[],
  funcionariosActivos: FuncionarioDB[],
  startDate: string,
  endDate: string,
  funcionarioId?: number
) {
  const scopedCitas = citas.filter((c) => {
    const inRange = c.fecha >= startDate && c.fecha <= endDate;
    const matchesProf = !funcionarioId || c.funcionario_id === funcionarioId;
    return inRange && matchesProf;
  });

  const totalAgendadas = scopedCitas.length;
  const totalAtendidas = scopedCitas.filter((c) => c.estado === 'Atendida').length;
  const totalCanceladas = scopedCitas.filter((c) => c.estado === 'Cancelada').length;
  const totalPendientes = scopedCitas.filter(
    (c) => c.estado === 'Confirmada' || c.estado === 'En Espera'
  ).length;

  const relevantProfs = funcionarioId
    ? funcionariosActivos.filter((f) => f.funcionario_id === funcionarioId)
    : funcionariosActivos.filter((f) => f.rol !== 'Administrativo');

  let cuposTotales = 0;
  let cuposTomados = 0;

  const cursor = parseISODateLocal(startDate);
  const limit = parseISODateLocal(endDate);
  let safetyCounter = 0;

  while (cursor <= limit && safetyCounter < 90) {
    const dateStr = toISODateLocal(cursor);
    const dow = cursor.getDay();

    if (DIAS_ATENCION_POSTA.includes(dow)) {
      for (const prof of relevantProfs) {
        cuposTotales += HORARIOS_POSTA.length;
        const takenForProfDay = HORARIOS_POSTA.filter((h) =>
          scopedCitas.some(
            (c) =>
              c.funcionario_id === prof.funcionario_id &&
              c.fecha === dateStr &&
              c.hora === h &&
              (c.estado === 'Confirmada' || c.estado === 'En Espera' || c.estado === 'Atendida')
          )
        ).length;
        cuposTomados += takenForProfDay;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
    safetyCounter++;
  }

  const cuposLibres = Math.max(0, cuposTotales - cuposTomados);

  const porcentajeAsistencia =
    totalAgendadas > 0 ? Math.round((totalAtendidas / totalAgendadas) * 100) : 0;

  const porcentajeOcupacion =
    cuposTotales > 0 ? Math.round((cuposTomados / cuposTotales) * 100) : 0;

  return {
    totalAgendadas,
    totalAtendidas,
    totalCanceladas,
    totalPendientes,
    cuposTotales,
    cuposTomados,
    cuposLibres,
    porcentajeAsistencia,
    porcentajeOcupacion,
    citasFiltradas: scopedCitas,
  };
}
