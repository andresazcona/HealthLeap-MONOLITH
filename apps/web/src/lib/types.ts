export type Rol = 'paciente' | 'medico' | 'admisión' | 'admin';
export type EstadoCita = 'agendada' | 'en espera' | 'atendida' | 'cancelada';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  created_at?: string;
}

export interface Medico {
  id: string;
  usuario_id: string;
  nombre: string;
  email: string;
  especialidad: string;
  centro_id: string;
  duracion_cita: number;
}

export interface Admision {
  id: string;
  usuario_id: string;
  nombre: string;
  email: string;
  area: string;
}

export interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha_hora: string;
  estado: EstadoCita;
  created_at: string;
  nombre_paciente: string;
  nombre_medico: string;
  especialidad: string;
  duracion_cita: number;
  email_paciente?: string;
}

export interface Bloque {
  inicio: string;
  fin: string;
}

export interface Disponibilidad {
  fecha: string;
  medico_id: string;
  bloquesDisponibles: Bloque[];
  bloquesBloqueados: Bloque[];
  citasAgendadas: { id: string; inicio: string; fin: string; paciente: string }[];
}

export interface Resumen {
  total: number;
  agendadas: number;
  enEspera: number;
  atendidas: number;
  canceladas: number;
  porEspecialidad: Record<string, number>;
}

export interface FilaReporte {
  id: string;
  fecha_hora: string;
  estado: EstadoCita;
  paciente_nombre: string;
  paciente_email: string;
  medico_nombre: string;
  especialidad: string;
  created_at: string;
}
