import { supabase } from './supabase.ts';
import { PROFESIONALES, Profesional, getProfesionalById } from './clinicData.ts';

export type EstadoCita = 'Confirmada' | 'En Espera' | 'Atendida' | 'Cancelada';

export interface CitaMedica {
  id: string;
  especialidad: string;
  profesionalId: string;
  profesionalNombre: string;
  pacienteNombre: string;
  pacienteRut: string;
  pacienteTelefono: string;
  agendadoPorRut: string;
  agendadoPorNombre?: string; // Presente si fue agendada por un cuidador / titular para una carga
  esCargaFamiliar?: boolean;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  lugar: string;
  box: string;
  indicaciones: string;
  estado: EstadoCita;
  createdAt: string;
}

const STORAGE_KEY = 'ruralmed_citas_db_v2';

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
 * Returns the next weekday (Mon-Fri) offset from today
 */
function getWorkingDayOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return toISODateLocal(d);
}

/**
 * Seed realistic appointments on first load so Staff Portal and Reports have live data
 */
function buildInitialSeedCitas(): CitaMedica[] {
  const today = toISODateLocal(new Date());
  const nextWorkDay = getWorkingDayOffset(1);
  const fullDayForAlejandro = getWorkingDayOffset(2);

  const profAlejandro = getProfesionalById('prof-alejandro-morales')!;
  const profDaniela = getProfesionalById('prof-daniela-rojas')!;
  const profPatricia = getProfesionalById('prof-patricia-fuentes')!;

  const seeds: CitaMedica[] = [
    {
      id: 'seed-1',
      especialidad: 'Control Cardiovascular y Crónico',
      profesionalId: profAlejandro.id,
      profesionalNombre: profAlejandro.nombre,
      pacienteNombre: 'Rosa María Espinoza',
      pacienteRut: '7.842.115-3',
      pacienteTelefono: '+56 9 8234 5511',
      agendadoPorRut: '7.842.115-3',
      fecha: today,
      hora: '09:00',
      lugar: 'Posta de Salud Rural de Melipilla',
      box: profAlejandro.box,
      indicaciones: profAlejandro.indicaciones,
      estado: 'Atendida',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seed-2',
      especialidad: 'Médico General',
      profesionalId: profAlejandro.id,
      profesionalNombre: profAlejandro.nombre,
      pacienteNombre: 'Juan Carlos Contreras',
      pacienteRut: '10.452.981-K',
      pacienteTelefono: '+56 9 7612 3340',
      agendadoPorRut: '10.452.981-K',
      fecha: today,
      hora: '09:30',
      lugar: 'Posta de Salud Rural de Melipilla',
      box: profAlejandro.box,
      indicaciones: profAlejandro.indicaciones,
      estado: 'Atendida',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seed-3',
      especialidad: 'Control Cardiovascular y Crónico',
      profesionalId: profAlejandro.id,
      profesionalNombre: profAlejandro.nombre,
      pacienteNombre: 'Marta Elena Figueroa',
      pacienteRut: '8.910.223-4',
      pacienteTelefono: '+56 9 9102 8841',
      agendadoPorRut: '8.910.223-4',
      fecha: today,
      hora: '10:30',
      lugar: 'Posta de Salud Rural de Melipilla',
      box: profAlejandro.box,
      indicaciones: profAlejandro.indicaciones,
      estado: 'Confirmada',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seed-4',
      especialidad: 'Médico General',
      profesionalId: profAlejandro.id,
      profesionalNombre: profAlejandro.nombre,
      pacienteNombre: 'Pedro Antonio Muñoz',
      pacienteRut: '11.234.567-8',
      pacienteTelefono: '+56 9 6543 2109',
      agendadoPorRut: '11.234.567-8',
      fecha: today,
      hora: '11:30',
      lugar: 'Posta de Salud Rural de Melipilla',
      box: profAlejandro.box,
      indicaciones: profAlejandro.indicaciones,
      estado: 'Cancelada',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seed-5',
      especialidad: 'Enfermería y Curaciones',
      profesionalId: profPatricia.id,
      profesionalNombre: profPatricia.nombre,
      pacienteNombre: 'Luis Alberto Paredes',
      pacienteRut: '9.321.654-0',
      pacienteTelefono: '+56 9 8877 1122',
      agendadoPorRut: '9.321.654-0',
      fecha: today,
      hora: '09:30',
      lugar: 'Posta de Salud Rural de Melipilla',
      box: profPatricia.box,
      indicaciones: profPatricia.indicaciones,
      estado: 'Confirmada',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seed-6',
      especialidad: 'Médico General',
      profesionalId: profDaniela.id,
      profesionalNombre: profDaniela.nombre,
      pacienteNombre: 'Carmen Gloria Soto',
      pacienteRut: '13.550.219-7',
      pacienteTelefono: '+56 9 7788 4455',
      agendadoPorRut: '13.550.219-7',
      fecha: nextWorkDay,
      hora: '10:00',
      lugar: 'Posta de Salud Rural de Melipilla',
      box: profDaniela.box,
      indicaciones: profDaniela.indicaciones,
      estado: 'En Espera',
      createdAt: new Date().toISOString(),
    },
  ];

  // Fill all slots on fullDayForAlejandro so users can clearly see a RED "full" day on the calendar
  if (fullDayForAlejandro !== today) {
    profAlejandro.horarios.forEach((h, idx) => {
      seeds.push({
        id: `seed-full-${idx}`,
        especialidad: 'Médico General',
        profesionalId: profAlejandro.id,
        profesionalNombre: profAlejandro.nombre,
        pacienteNombre: `Paciente Agenda Completa ${idx + 1}`,
        pacienteRut: `${12 + idx}.110.22${idx}-${idx}`,
        pacienteTelefono: `+56 9 8000 000${idx}`,
        agendadoPorRut: `${12 + idx}.110.22${idx}-${idx}`,
        fecha: fullDayForAlejandro,
        hora: h,
        lugar: 'Posta de Salud Rural de Melipilla',
        box: profAlejandro.box,
        indicaciones: profAlejandro.indicaciones,
        estado: 'Confirmada',
        createdAt: new Date().toISOString(),
      });
    });
  }

  return seeds;
}

export function loadAllCitas(): CitaMedica[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildInitialSeedCitas();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as CitaMedica[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return buildInitialSeedCitas();
  }
}

function saveAllCitas(citas: CitaMedica[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(citas));
  } catch (e) {
    console.warn('No se pudo persistir citas en localStorage', e);
  }
}

/**
 * Checks whether a specific slot (fecha + hora + profesionalId) is already occupied
 * by an active appointment ('Confirmada' or 'En Espera' or 'Atendida').
 * Cancelled appointments ('Cancelada') do NOT block the slot.
 */
export function isSlotOccupied(
  citas: CitaMedica[],
  profesionalId: string,
  fecha: string,
  hora: string
): boolean {
  return citas.some(
    (c) =>
      c.profesionalId === profesionalId &&
      c.fecha === fecha &&
      c.hora === hora &&
      (c.estado === 'Confirmada' || c.estado === 'En Espera' || c.estado === 'Atendida')
  );
}

/**
 * Computes day availability for a professional on a given YYYY-MM-DD date.
 */
export function getDayAvailability(
  citas: CitaMedica[],
  profesional: Profesional,
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
  if (!profesional.diasAtencion.includes(dayOfWeek)) {
    return { status: 'unavailable', freeSlots: 0, totalSlots: 0 };
  }

  const totalSlots = profesional.horarios.length;
  const occupiedCount = profesional.horarios.filter((h) =>
    isSlotOccupied(citas, profesional.id, dateStr, h)
  ).length;
  const freeSlots = Math.max(0, totalSlots - occupiedCount);

  if (freeSlots === 0) {
    return { status: 'full', freeSlots: 0, totalSlots };
  }

  return { status: 'available', freeSlots, totalSlots };
}

/**
 * Books an appointment with strict duplicate prevention (both client + DB check).
 */
export async function bookAppointment(
  nueva: Omit<CitaMedica, 'id' | 'createdAt'>
): Promise<{ success: boolean; cita?: CitaMedica; error?: string }> {
  const current = loadAllCitas();

  // Strict validation: prevent duplicate active booking on same date + time + professional
  if (isSlotOccupied(current, nueva.profesionalId, nueva.fecha, nueva.hora)) {
    return {
      success: false,
      error: `El bloque de las ${nueva.hora} hrs del ${nueva.fecha} con ${nueva.profesionalNombre} ya no está disponible. Por favor seleccione otro horario.`,
    };
  }

  // Also check Supabase citas table for any duplicate (non-blocking if schema/RLS differs)
  try {
    const { data: existingDb } = await supabase
      .from('citas')
      .select('*')
      .eq('fecha', nueva.fecha)
      .eq('hora', nueva.hora)
      .eq('profesional', nueva.profesionalNombre)
      .in('estado', ['Confirmada', 'En Espera']);

    if (existingDb && existingDb.length > 0) {
      return {
        success: false,
        error: `Ese horario ya fue reservado en el servidor. Seleccione otro bloque disponible.`,
      };
    }
  } catch {
    // Graceful fallback if RLS or column naming differs in external DB
  }

  const citaCreada: CitaMedica = {
    ...nueva,
    id: `cita-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  // Attempt best-effort sync to Supabase `citas` table
  try {
    await supabase.from('citas').insert([
      {
        especialidad: citaCreada.especialidad,
        profesional: citaCreada.profesionalNombre,
        paciente_rut: citaCreada.pacienteRut,
        paciente_nombre: citaCreada.pacienteNombre,
        fecha: citaCreada.fecha,
        hora: citaCreada.hora,
        lugar: citaCreada.lugar,
        estado: citaCreada.estado,
      },
    ]);
  } catch {
    // RLS may restrict anonymous writes; local shared DB remains source of truth
  }

  const updated = [citaCreada, ...current];
  saveAllCitas(updated);
  return { success: true, cita: citaCreada };
}

/**
 * Updates appointment status ('Atendida' | 'Cancelada' | 'Confirmada' | 'En Espera').
 * When set to 'Cancelada', the slot (fecha + hora + profesionalId) is immediately released.
 */
export async function updateAppointmentStatus(
  citaId: string,
  nuevoEstado: EstadoCita
): Promise<CitaMedica[]> {
  const current = loadAllCitas();
  const updated = current.map((c) =>
    c.id === citaId ? { ...c, estado: nuevoEstado } : c
  );
  saveAllCitas(updated);

  // Best-effort sync to Supabase
  try {
    const target = updated.find((c) => c.id === citaId);
    if (target) {
      await supabase
        .from('citas')
        .update({ estado: nuevoEstado })
        .eq('fecha', target.fecha)
        .eq('hora', target.hora)
        .eq('paciente_rut', target.pacienteRut);
    }
  } catch {
    // ignore RLS/network errors
  }

  return updated;
}

/**
 * Returns appointments belonging to a patient (either as pacienteRut or agendadoPorRut)
 */
export function getCitasDePaciente(citas: CitaMedica[], rutUsuario: string): CitaMedica[] {
  const cleanUser = rutUsuario.replace(/\./g, '').toUpperCase();
  return citas
    .filter((c) => {
      const pRut = c.pacienteRut.replace(/\./g, '').toUpperCase();
      const aRut = c.agendadoPorRut.replace(/\./g, '').toUpperCase();
      return pRut === cleanUser || aRut === cleanUser;
    })
    .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
}

/**
 * Deletes all appointments associated with a professional (by profesionalId or nombre)
 */
export async function deleteCitasByProfesional(profesionalId: string, profesionalNombre?: string): Promise<CitaMedica[]> {
  const current = loadAllCitas();
  const updated = current.filter(
    (c) =>
      c.profesionalId !== profesionalId &&
      (!profesionalNombre || c.profesionalNombre.toLowerCase() !== profesionalNombre.toLowerCase())
  );
  saveAllCitas(updated);

  try {
    if (profesionalNombre) {
      await supabase.from('citas').delete().eq('profesional', profesionalNombre);
    }
  } catch {
    // ignore RLS errors
  }

  return updated;
}

/**
 * Deletes all appointments associated with a patient RUT
 */
export async function deleteCitasByPaciente(rutPaciente: string): Promise<CitaMedica[]> {
  const cleanTarget = rutPaciente.replace(/\./g, '').toUpperCase();
  const current = loadAllCitas();
  const updated = current.filter((c) => {
    const pRut = c.pacienteRut.replace(/\./g, '').toUpperCase();
    const aRut = c.agendadoPorRut.replace(/\./g, '').toUpperCase();
    return pRut !== cleanTarget && aRut !== cleanTarget;
  });
  saveAllCitas(updated);

  try {
    await supabase.from('citas').delete().eq('paciente_rut', rutPaciente);
  } catch {
    // ignore RLS errors
  }

  return updated;
}

/**
 * Computes real-time statistics for a date or date range and optional profesionalId filter
 */
export function calculateStatsForRange(
  citas: CitaMedica[],
  startDate: string,
  endDate: string,
  profesionalId?: string
) {
  const scopedCitas = citas.filter((c) => {
    const inRange = c.fecha >= startDate && c.fecha <= endDate;
    const matchesProf = !profesionalId || c.profesionalId === profesionalId;
    return inRange && matchesProf;
  });

  const totalAgendadas = scopedCitas.length;
  const totalAtendidas = scopedCitas.filter((c) => c.estado === 'Atendida').length;
  const totalCanceladas = scopedCitas.filter((c) => c.estado === 'Cancelada').length;
  const totalPendientes = scopedCitas.filter(
    (c) => c.estado === 'Confirmada' || c.estado === 'En Espera'
  ).length;

  // Calculate total capacity (cupos totales) across the date range for relevant professionals
  const relevantProfs = profesionalId
    ? PROFESIONALES.filter((p) => p.id === profesionalId)
    : PROFESIONALES;

  let cuposTotales = 0;
  let cuposTomados = 0;

  const cursor = parseISODateLocal(startDate);
  const limit = parseISODateLocal(endDate);
  let safetyCounter = 0;

  while (cursor <= limit && safetyCounter < 90) {
    const dateStr = toISODateLocal(cursor);
    const dow = cursor.getDay();

    for (const prof of relevantProfs) {
      if (prof.diasAtencion.includes(dow)) {
        cuposTotales += prof.horarios.length;
        const takenForProfDay = prof.horarios.filter((h) =>
          isSlotOccupied(scopedCitas, prof.id, dateStr, h)
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
