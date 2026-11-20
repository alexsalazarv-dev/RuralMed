import { createClient } from '@supabase/supabase-js';

// Configuration as required by RuralMed specifications
export const SUPABASE_URL = "https://yytnsfbekpfnbadaurte.supabase.co/rest/v1/";
export const SUPABASE_ANON_KEY = "sb_publishable_r32Q50jjZLblcoEQn39NFQ_u3mxeEzU";

/**
 * Normalizes URL: @supabase/supabase-js expects the root project origin (e.g. https://xxx.supabase.co)
 * and internally appends /rest/v1/. Stripping trailing /rest/v1 ensures standard SDK compatibility.
 */
const getBaseUrl = (url: string) => {
  return url.replace(/\/rest\/v1\/?$/, '');
};

export const supabase = createClient(getBaseUrl(SUPABASE_URL), SUPABASE_ANON_KEY);

export interface Usuario {
  usuario_id?: number;
  rut: string;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string; // YYYY-MM-DD
  email: string;
  celular: string;
  direccion: string;
  ciudad: string;
  fecha_registro?: string;
}

export interface FuncionarioDB {
  funcionario_id: number;
  rut: string;
  email: string;
  password?: string;
  nombre_completo: string;
  rol: 'Médico' | 'Kinesiólogo' | 'Administrativo' | string;
  especialidad: string;
  activo: boolean;
  fecha_registro?: string;
}

export type EstadoCita = 'Confirmada' | 'En Espera' | 'Atendida' | 'Cancelada';

export interface CitaDB {
  cita_id: number;
  usuario_id: number;
  funcionario_id: number;
  paciente_nombre: string;
  tipo_atencion: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // ej. '09:30 hrs'
  lugar: string;
  estado: EstadoCita;
  created_at?: string;
  funcionarios?: FuncionarioDB | null;
  usuarios?: Usuario | null;
}

/**
 * Format Chilean RUT with dots and dash (e.g. 12.345.678-9)
 */
export function formatRUT(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean;

  const dv = clean.slice(-1);
  const rutBody = clean.slice(0, -1);

  const formattedBody = rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

/**
 * Clean RUT to standard raw form without dots (e.g. 123456789)
 */
export function cleanRUT(value: string): string {
  return value.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Normalize phone numbers to standard format for matching
 */
export function normalizePhone(value: string): string {
  return value.replace(/\s+/g, '').replace(/^[+]/, '');
}
