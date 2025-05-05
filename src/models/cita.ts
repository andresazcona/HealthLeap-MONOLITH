export type EstadoCita = 'agendada' | 'en espera' | 'atendida' | 'cancelada';

export interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha_hora: Date;
  estado: EstadoCita;
  created_at: Date;
}

export interface CitaInput {
  paciente_id: string;
  medico_id: string;
  fecha_hora: Date;
}

export interface CitaUpdateInput {
  fecha_hora?: Date;
  estado?: EstadoCita;
}

export interface CitaCompleta extends Cita {
  nombre_paciente: string;
  nombre_medico: string;
  especialidad: string;
  duracion_cita: number;
  email_paciente?: string; // Añadido para notificaciones por email
}

export interface CitaFiltro {
  fecha_inicio?: Date;
  fecha_fin?: Date;
  paciente_id?: string;
  medico_id?: string;
  estado?: EstadoCita;
}

export interface DisponibilidadParams {
  medico_id: string;
  fecha: string;
}