export interface Medico {
    id: string;
    usuario_id: string;
    especialidad: string;
    centro_id: string;
    duracion_cita: number;
  }
  
  export interface MedicoInput {
    usuario_id: string;
    especialidad: string;
    centro_id: string;
    duracion_cita?: number;
  }
  
  export interface MedicoUpdateInput {
    especialidad?: string;
    centro_id?: string;
    duracion_cita?: number;
  }
  
  export interface MedicoCompleto {
    id: string;
    usuario_id: string;
    nombre: string;
    email: string;
    especialidad: string;
    centro_id: string;
    duracion_cita: number;
  }
  
  export interface MedicoFiltro {
    especialidad?: string;
    centro_id?: string;
  }