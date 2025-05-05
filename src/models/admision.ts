export interface Admision {
    id: string;
    usuario_id: string;
    area: string;
  }
  
  export interface AdmisionInput {
    usuario_id: string;
    area: string;
  }
  
  export interface AdmisionUpdateInput {
    area?: string;
  }
  
  export interface AdmisionCompleto {
    id: string;
    usuario_id: string;
    nombre: string;
    email: string;
    area: string;
  }