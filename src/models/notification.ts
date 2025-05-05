export interface EmailNotification {
    to: string;
    subject: string;
    body: string;
  }
  
  export interface WhatsAppNotification {
    to: string;
    message: string;
  }
  
  export interface NotificacionCita {
    nombrePaciente: string;
    nombreMedico: string;
    especialidad: string;
    fecha: string;
    hora: string;
    estado: string;
    contactoPaciente: string;
    contactoMedico: string;
    emailPaciente: string; // Añadido para notificaciones por email
  }