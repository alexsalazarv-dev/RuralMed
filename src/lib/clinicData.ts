// Clinic schedule constants (no mock users or mock appointments)

export const TIPOS_ATENCION_BASE: string[] = [
  'Médico General / Consulta',
  'Kinesiología',
  'Control Cardiovascular y Crónico',
  'Ronda Médica General',
];

export const HORARIOS_POSTA: string[] = [
  '09:00 hrs',
  '09:30 hrs',
  '10:30 hrs',
  '11:30 hrs',
  '14:30 hrs',
  '15:30 hrs',
];

// Lunes (1) a Viernes (5)
export const DIAS_ATENCION_POSTA: number[] = [1, 2, 3, 4, 5];

export const LUGAR_POSTA_DEFAULT = 'Posta de Salud Rural de Melipilla';

export function getIndicacionesPorEspecialidad(especialidad: string): string {
  if (especialidad.toLowerCase().includes('kinesiolog')) {
    return 'Presentarse 15 minutos antes con cédula de identidad y ropa cómoda para evaluación o terapia.';
  }
  if (especialidad.toLowerCase().includes('cardiovascular')) {
    return 'Presentarse 15 minutos antes con cédula de identidad y carnet de control crónico.';
  }
  return 'Presentarse 15 minutos antes con cédula de identidad.';
}

export function getBoxPorRol(rol: string, especialidad: string): string {
  if (rol === 'Kinesiólogo' || especialidad.toLowerCase().includes('kinesiolog')) {
    return 'Sala IRA / ERA - Rehabilitación';
  }
  if (especialidad.toLowerCase().includes('ronda')) {
    return 'Ronda Médica Rural';
  }
  return 'Box de Atención Médica';
}
