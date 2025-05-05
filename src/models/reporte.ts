export interface FiltroReporte {
    desde?: Date;
    hasta?: Date;
    estado?: string;
    medico_id?: string;
  }
  
  export interface ReporteCitaRow {
    id: string;
    fecha_hora: Date;
    estado: string;
    paciente_nombre: string;
    paciente_email: string;
    medico_nombre: string;
    especialidad: string;
    created_at: Date;
  }
  
  export interface ReporteResumen {
    total: number;
    agendadas: number;
    atendidas: number;
    canceladas: number;
    enEspera: number;
    porEspecialidad: Record<string, number>;
  }