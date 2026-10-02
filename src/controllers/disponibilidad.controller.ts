import { Request, Response, NextFunction } from 'express';
import disponibilidadService from '../services/disponibilidad.service';
import { getMedicoIdDelUsuario } from '../utils/medico-del-usuario';
import AppError from '../utils/AppError';

class DisponibilidadController {
  /**
   * Obtiene la disponibilidad de un médico en una fecha específica
   */
  async getDisponibilidadMedico(req: Request, res: Response, next: NextFunction) {
    try {
      const { medicoId, fecha } = req.params;
      const disponibilidad = await disponibilidadService.getDisponibilidadMedico(medicoId, fecha);
      return res.status(200).json({ status: 'success', data: disponibilidad });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Obtiene la agenda global de todos los médicos
   */
  async getAgendaGlobal(req: Request, res: Response, next: NextFunction) {
    try {
      const agenda = await disponibilidadService.getAgendaGlobal(req.params.fecha);
      return res.status(200).json({ status: 'success', data: agenda });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Bloquea horarios en la agenda de un médico
   */
  async bloquearHorarios(req: Request, res: Response, next: NextFunction) {
    try {
      const medico_id = req.user!.rol === 'medico'
        ? await getMedicoIdDelUsuario(req.user!.id)
        : req.body.medico_id;

      if (!medico_id) {
        throw new AppError('medico_id es obligatorio', 400);
      }

      const configuracion = await disponibilidadService.bloquearHorarios({
        medico_id,
        fecha: req.body.fecha,
        bloques_bloqueados: req.body.bloques_bloqueados
      });

      return res.status(200).json({ status: 'success', data: configuracion });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Cierra la agenda de un médico para una fecha específica
   */
  async cerrarAgenda(req: Request, res: Response, next: NextFunction) {
    try {
      const { medicoId, fecha } = req.params;
      await disponibilidadService.cerrarAgenda(medicoId, fecha);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

export default new DisponibilidadController();
