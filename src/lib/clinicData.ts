export interface Profesional {
  id: string;
  nombre: string;
  titulo: string;
  especialidades: string[];
  box: string;
  diasAtencion: number[]; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  horarios: string[];
  indicaciones: string;
}

export interface Funcionario {
  id: string;
  rut: string;
  email: string;
  password: string;
  nombre: string;
  cargo: string;
  rol: 'doctor' | 'admin';
  profesionalId?: string; // Vinculado a Profesional.id si es doctor
  posta: string;
}

export const TIPOS_ATENCION: string[] = [
  'Médico General',
  'Control Cardiovascular y Crónico',
  'Enfermería y Curaciones',
  'Kinesiología',
  'Control Dental Rural',
  'Toma de Muestras y Exámenes',
];

export const PROFESIONALES: Profesional[] = [
  {
    id: 'prof-alejandro-morales',
    nombre: 'Dr. Alejandro Morales Fuentes',
    titulo: 'Médico Cirujano Rural',
    especialidades: ['Médico General', 'Control Cardiovascular y Crónico'],
    box: 'Box 1 - Medicina General',
    diasAtencion: [1, 2, 3, 4, 5], // Lunes a Viernes
    horarios: ['09:00', '09:30', '10:30', '11:30', '14:30', '15:30'],
    indicaciones: 'Presentarse 15 minutos antes con cédula de identidad y carnet de control crónico si corresponde.',
  },
  {
    id: 'prof-daniela-rojas',
    nombre: 'Dra. Daniela Rojas Paredes',
    titulo: 'Médico EDF Atención Primaria',
    especialidades: ['Médico General', 'Control Cardiovascular y Crónico'],
    box: 'Box 2 - Consulta Médica',
    diasAtencion: [1, 2, 4, 5], // Lunes, Martes, Jueves, Viernes (Miércoles en ronda)
    horarios: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    indicaciones: 'Presentarse 15 minutos antes con cédula de identidad y lista de medicamentos actuales.',
  },
  {
    id: 'prof-patricia-fuentes',
    nombre: 'Enf. Patricia Fuentes Tapia',
    titulo: 'Enfermera Universitaria',
    especialidades: ['Enfermería y Curaciones', 'Control Cardiovascular y Crónico', 'Toma de Muestras y Exámenes'],
    box: 'Box 3 - Procedimientos y Enfermería',
    diasAtencion: [1, 2, 3, 4, 5],
    horarios: ['08:30', '09:30', '10:30', '11:30', '14:30'],
    indicaciones: 'Presentarse 15 minutos antes con cédula de identidad. Para exámenes de sangre acudir en ayuno de 8 a 12 horas.',
  },
  {
    id: 'prof-javier-soto',
    nombre: 'Klgo. Javier Soto Valenzuela',
    titulo: 'Kinesiólogo Respiratorio y Motor',
    especialidades: ['Kinesiología'],
    box: 'Sala IRA / ERA - Rehabilitación',
    diasAtencion: [1, 3, 5], // Lunes, Miércoles, Viernes
    horarios: ['09:00', '10:00', '11:00', '14:30', '15:30'],
    indicaciones: 'Presentarse 15 minutos antes con cédula de identidad y ropa cómoda para evaluación o terapia.',
  },
  {
    id: 'prof-carolina-vega',
    nombre: 'Dra. Carolina Vega Sepúlveda',
    titulo: 'Cirujano Dentista',
    especialidades: ['Control Dental Rural'],
    box: 'Box 4 - Clínica Dental',
    diasAtencion: [2, 3, 4], // Martes, Miércoles, Jueves
    horarios: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    indicaciones: 'Presentarse 15 minutos antes con cédula de identidad y cepillado dental previo.',
  },
  {
    id: 'prof-roberto-diaz',
    nombre: 'TENS Roberto Díaz Muñoz',
    titulo: 'Técnico en Enfermería de Nivel Superior',
    especialidades: ['Toma de Muestras y Exámenes', 'Enfermería y Curaciones'],
    box: 'Box 5 - Toma de Muestras',
    diasAtencion: [1, 2, 3, 4, 5],
    horarios: ['08:00', '08:30', '09:00', '09:30', '10:00'],
    indicaciones: 'Presentarse 15 minutos antes con cédula de identidad y orden de exámenes en ayuno de 8 horas.',
  },
];

export const FUNCIONARIOS_PRUEBA: Funcionario[] = [
  {
    id: 'func-alejandro',
    rut: '14.520.890-3',
    email: 'alejandro.morales@ruralmed.cl',
    password: 'ruralmed2026',
    nombre: 'Dr. Alejandro Morales Fuentes',
    cargo: 'Médico Cirujano Rural',
    rol: 'doctor',
    profesionalId: 'prof-alejandro-morales',
    posta: 'Posta de Salud Rural',
  },
  {
    id: 'func-admin',
    rut: '16.890.432-1',
    email: 'admin@ruralmed.cl',
    password: 'admin2026',
    nombre: 'Camila Herrera Lagos',
    cargo: 'Administradora de Posta Rural',
    rol: 'admin',
    posta: 'Posta de Salud Rural (Dirección)',
  },
];

export function getProfesionalesPorEspecialidad(especialidad: string): Profesional[] {
  return PROFESIONALES.filter((p) => p.especialidades.includes(especialidad));
}

export function getProfesionalById(id: string): Profesional | undefined {
  return PROFESIONALES.find((p) => p.id === id);
}
