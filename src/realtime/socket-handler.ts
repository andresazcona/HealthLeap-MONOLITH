import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';
import config from '../config/enviroment';

interface UserSocket {
  userId: string;
  rol: string;
  socketId: string;
}

// Almacenamiento en memoria de los sockets conectados
const connectedUsers: Map<string, UserSocket> = new Map();
// Guardar sockets de médicos por ID
const medicoSockets: Map<string, string[]> = new Map();

// Verificar token de socket
const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Token de autenticación requerido'));
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; rol: string };
    
    // Guardar información del usuario en el socket
    socket.data.user = {
      id: decoded.id,
      rol: decoded.rol
    };
    
    next();
  } catch (error) {
    next(new Error('Token no válido o expirado'));
  }
};

export const setupSocketHandlers = (io: Server) => {
  // Middleware de autenticación
  io.use(authenticateSocket);
  
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?.id;
    const userRol = socket.data.user?.rol;
    
    if (!userId || !userRol) {
      socket.disconnect(true);
      return;
    }
    
    logger.info(`Usuario conectado: ${userId}, rol: ${userRol}`);
    
    // Registrar usuario conectado
    connectedUsers.set(userId, {
      userId,
      rol: userRol,
      socketId: socket.id
    });
    
    // Si es médico, registrarlo en la lista de médicos
    if (userRol === 'medico') {
      if (!medicoSockets.has(userId)) {
        medicoSockets.set(userId, []);
      }
      medicoSockets.get(userId)?.push(socket.id);
      
      // El médico se une a su sala personal
      socket.join(`medico-${userId}`);
    }
    
    // Evento para cuando un paciente llega (admisión marca llegada)
    socket.on('paciente-llegada', (data: { medicoId: string, citaId: string, nombrePaciente: string }) => {
      // Notificar al médico correspondiente
      io.to(`medico-${data.medicoId}`).emit('paciente-en-espera', {
        citaId: data.citaId,
        nombrePaciente: data.nombrePaciente,
        horaLlegada: new Date().toISOString()
      });
    });
    
    // Desconexión
    socket.on('disconnect', () => {
      logger.info(`Usuario desconectado: ${userId}`);
      
      // Eliminar del registro de usuarios conectados
      connectedUsers.delete(userId);
      
      // Si era médico, eliminar de esa lista
      if (userRol === 'medico') {
        const sockets = medicoSockets.get(userId) || [];
        const index = sockets.indexOf(socket.id);
        
        if (index !== -1) {
          sockets.splice(index, 1);
        }
        
        if (sockets.length === 0) {
          medicoSockets.delete(userId);
        } else {
          medicoSockets.set(userId, sockets);
        }
      }
    });
  });
  
  // Exponer método para notificar a médicos desde servicios
  return {
    notificarMedico: (medicoId: string, evento: string, datos: any) => {
      io.to(`medico-${medicoId}`).emit(evento, datos);
    }
  };
};

// Función auxiliar para verificar si un médico está online
export const isMedicoOnline = (medicoId: string): boolean => {
  return medicoSockets.has(medicoId) && (medicoSockets.get(medicoId)?.length || 0) > 0;
};

// Función para enviar notificación a un usuario
export const enviarNotificacion = (io: Server, userId: string, tipo: string, datos: any) => {
  const userSocket = connectedUsers.get(userId);
  
  if (userSocket) {
    io.to(userSocket.socketId).emit(tipo, datos);
    return true;
  }
  
  return false;
};