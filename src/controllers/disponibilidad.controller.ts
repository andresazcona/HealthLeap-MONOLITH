import { Request, Response, NextFunction } from 'express';
import disponibilidadService from '../services/disponibilidad.service';

class DisponibilidadController {
  /**
   * Obtiene la disponibilidad de un médico en una fecha específica
   */
  async getDisponibilidadMedico(req: Request, res: Response, next: NextFunction) {
    try {
      const medicoId = req.params.medicoId;
      const fecha = req.query.fecha as string;
      
      const disponibilidad = await disponibilidadService.getDisponibilidadMedico(medicoId, fecha);
      
      res.status(200).json({
        status: 'success',
        data: disponibilidad
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene la agenda global de todos los médicos
   */
  async getAgendaGlobal(req: Request, res: Response, next: NextFunction) {
    try {
      const fecha = req.query.fecha as string;
      
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
   * Configura la agenda de un médico bloqueando horarios
   */
  async bloquearHorarios(req: Request, res: Response, next: NextFunction) {
    try {
      const { medico_id, fecha, bloques_bloqueados } = req.body;
      
      // Usar bloquearHorarios en lugar de configurarDisponibilidad
      const configuracion = await disponibilidadService.bloquearHorarios({
        medico_id,
        fecha,
        bloques_bloqueados
      });
      
      res.status(200).json({
        status: 'success',
        data: configuracion
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cierra la agenda de un médico para una fecha específica
   */
  async cerrarAgenda(req: Request, res: Response, next: NextFunction) {
    try {
      const { medicoId, fecha } = req.params;
      
      // Usar cerrarAgenda en lugar de bloquearDia
      await disponibilidadService.cerrarAgenda(medicoId, fecha);
      
      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }
}

export default new DisponibilidadController();