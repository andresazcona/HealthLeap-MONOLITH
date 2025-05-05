export interface BloqueDisponible {
    inicio: Date;
    fin: Date;
  }
  
  export interface BloqueBloqueado {
    fecha: string;
    bloques: BloqueDisponible[];
    medico_id: string;
  }
  
  export interface DisponibilidadDiaria {
    fecha: string;
    medico_id: string;
    bloquesDisponibles: BloqueDisponible[];
    bloquesBloqueados: BloqueDisponible[];
    citasAgendadas: {
      id: string;
      inicio: Date;
      fin: Date;
      paciente: string;
    }[];
  }
  
  export interface ConfiguracionAgenda {
    medico_id: string;
    fecha: string;
    bloques_bloqueados: BloqueDisponible[];
  }