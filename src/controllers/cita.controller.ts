import { Request, Response, NextFunction } from 'express';
import citaService from '../services/cita.service';
import AppError from '../utils/AppError';
import { getMedicoIdDelUsuario } from '../utils/medico-del-usuario';

const paginar = (req: Request) => ({
  page: parseInt(req.query.page as string) || 1,
  limit: parseInt(req.query.limit as string) || 10,
});

class CitaController {
  /**
   * Crea una nueva cita
   */
  async createCita(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Un paciente solo puede agendar para sí mismo
      if (req.user?.rol === 'paciente') {
        req.body.paciente_id = req.user.id;
      }
      if (!req.body.paciente_id) {
        throw new AppError('paciente_id es obligatorio', 400);
      }

      const cita = await citaService.createCita(req.body);
      return res.status(201).json({ status: 'success', data: cita });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene una cita por ID
   */
  async getCitaById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const cita = await citaService.getCitaById(req.params.id);

      if (req.user?.rol === 'paciente' && cita.paciente_id !== req.user.id) {
        throw new AppError('No tienes permiso para ver esta cita', 403);
      }
      if (req.user?.rol === 'medico' && cita.medico_id !== await getMedicoIdDelUsuario(req.user.id)) {
        throw new AppError('No tienes permiso para ver esta cita', 403);
      }

      return res.status(200).json({ status: 'success', data: cita });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Agenda del médico autenticado
   */
  async getAgendaMedico(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const medicoId = await getMedicoIdDelUsuario(req.user!.id);
      const fecha = req.query.fecha ? new Date(req.query.fecha as string) : undefined;
      const { page, limit } = paginar(req);

      const result = await citaService.getAgendaMedico(medicoId, fecha, page, limit);

      return res.status(200).json({
        status: 'success',
        results: result.citas.length,
        data: result.citas,
        pagination: { total: result.total, page, limit }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Citas del usuario autenticado (paciente o médico)
   */
  async getMisCitas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { page, limit } = paginar(req);
      const result = req.user!.rol === 'medico'
        ? await citaService.getAgendaMedico(await getMedicoIdDelUsuario(req.user!.id), undefined, page, limit)
        : await citaService.getCitasByPacienteId(req.user!.id, page, limit);

      return res.status(200).json({
        status: 'success',
        results: result.citas.length,
        data: result.citas,
        pagination: { total: result.total, page, limit }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualiza una cita
   */
  async updateCita(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const cita = await citaService.getCitaById(req.params.id);

      if (req.user?.rol === 'paciente' && cita.paciente_id !== req.user.id) {
        throw new AppError('No tienes permiso para actualizar esta cita', 403);
      }

      const updatedCita = await citaService.updateCita(req.params.id, req.body);
      return res.status(200).json({ status: 'success', data: updatedCita });
    } catch (error) {
      next(error);
    }
  }

  /**
   * El médico marca una cita como atendida
   */
  async marcarCitaAtendida(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const medicoId = await getMedicoIdDelUsuario(req.user!.id);
      const updatedCita = await citaService.marcarCitaAtendida(req.params.id, medicoId);
      return res.status(200).json({ status: 'success', data: updatedCita });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admisión marca que el paciente llegó
   */
  async marcarPacienteLlegada(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const updatedCita = await citaService.marcarPacienteLlegada(req.params.id);
      return res.status(200).json({ status: 'success', data: updatedCita });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualiza el estado de una cita
   */
  async updateEstadoCita(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const updatedCita = await citaService.updateEstadoCita(req.params.id, req.body.estado);
      return res.status(200).json({ status: 'success', data: updatedCita });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancela una cita
   */
  async cancelarCita(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const cita = await citaService.getCitaById(req.params.id);

      if (req.user?.rol === 'paciente' && cita.paciente_id !== req.user.id) {
        throw new AppError('No tienes permiso para cancelar esta cita', 403);
      }

      await citaService.cancelarCita(req.params.id);
      return res.status(200).json({
        status: 'success',
        data: { id: req.params.id, estado: 'cancelada' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Filtra citas por diferentes criterios
   */
  async filtrarCitas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { page, limit } = paginar(req);
      const result = await citaService.filtrarCitas(req.query as any, page, limit);

      return res.status(200).json({
        status: 'success',
        results: result.citas.length,
        data: result.citas,
        pagination: { total: result.total, page, limit }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Agenda de todas las citas de un día
   */
  async getAgendaDiaria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const fecha = req.query.fecha ? new Date(req.query.fecha as string) : new Date();
      const citas = await citaService.getAgendaDiaria(fecha);
      return res.status(200).json({ status: 'success', results: citas.length, data: citas });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envía recordatorios para citas del día siguiente
   */
  async enviarRecordatorios(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const enviados = await citaService.enviarRecordatoriosCitasDiaSiguiente();
      return res.status(200).json({
        status: 'success',
        message: `Se han enviado ${enviados} recordatorios correctamente`
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CitaController();
