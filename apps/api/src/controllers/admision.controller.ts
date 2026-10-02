import { Request, Response, NextFunction } from 'express';
import admisionService from '../services/admision.service';
import disponibilidadService from '../services/disponibilidad.service';
import citaService from '../services/cita.service';

class AdmisionController {
  /**
   * Obtiene la agenda para una fecha específica
   */
  async getAgenda(req: Request, res: Response, next: NextFunction) {
    try {
      const fecha = req.query.fecha as string;
      
      // Usar el servicio de disponibilidad para obtener la agenda global
      const agenda = await disponibilidadService.getAgendaGlobal(fecha);
      
      res.status(200).json({
        status: 'success',
        data: agenda
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Marca la llegada de un paciente
   */
  async marcarLlegada(req: Request, res: Response, next: NextFunction) {
    try {
      const citaId = req.params.id;
      
      // Usar el servicio de cita para marcar el estado como 'en espera'
      const cita = await citaService.updateEstadoCita(citaId, 'en espera');
      
      res.status(200).json({
        status: 'success',
        data: cita
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza datos de una cita
   */
  async actualizarCita(req: Request, res: Response, next: NextFunction) {
    try {
      const citaId = req.params.id;
      
      // Usar el servicio de cita para actualizar la cita
      const cita = await citaService.updateCita(citaId, req.body);
      
      res.status(200).json({
        status: 'success',
        data: cita
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene todos los personales de admisión
   */
  async getAllAdmisiones(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await admisionService.getAllAdmisiones(page, limit);
      
      res.status(200).json({
        status: 'success',
        results: result.total,
        data: result.admisiones,
        pagination: {
          total: result.total,
          page,
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Crea un nuevo personal de admisión
   */
  async createAdmision(req: Request, res: Response, next: NextFunction) {
    try {
      const admision = await admisionService.createAdmision(req.body);
      
      res.status(201).json({
        status: 'success',
        data: admision
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene un personal de admisión por ID
   */
  async getAdmisionById(req: Request, res: Response, next: NextFunction) {
    try {
      const admision = await admisionService.getAdmisionById(req.params.id);
      
      res.status(200).json({
        status: 'success',
        data: admision
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene el perfil del personal de admisión actualmente autenticado
   */
  async getAdmisionPerfil(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore - El usuario es añadido por el middleware de autenticación
      const usuarioId = req.user.id;
      const admision = await admisionService.getAdmisionByUsuarioId(usuarioId);
      
      res.status(200).json({
        status: 'success',
        data: admision
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza un personal de admisión
   */
  async updateAdmision(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedAdmision = await admisionService.updateAdmision(req.params.id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: updatedAdmision
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Elimina un personal de admisión
   */
  async deleteAdmision(req: Request, res: Response, next: NextFunction) {
    try {
      await admisionService.deleteAdmision(req.params.id);
      
      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene todas las áreas disponibles
   */
  async getAllAreas(req: Request, res: Response, next: NextFunction) {
    try {
      const areas = await admisionService.getAllAreas();
      
      res.status(200).json({
        status: 'success',
        data: areas
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdmisionController();