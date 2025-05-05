import { Request, Response, NextFunction } from 'express';
import citaService from '../services/cita.service';
import disponibilidadService from '../services/disponibilidad.service';

class CitaController {
  /**
   * Crea una nueva cita
   */
  async createCita(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Si el usuario es paciente, usar su ID como paciente_id
      if (req.user?.rol === 'paciente') {
        req.body.paciente_id = req.user.id;
      }
      
      const cita = await citaService.createCita(req.body);
      
      res.status(201).json({
        status: 'success',
        data: cita
      });
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
      
      // Verificar acceso a la cita (paciente solo puede ver sus propias citas)
      if (req.user?.rol === 'paciente' && cita.paciente_id !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para ver esta cita'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: cita
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene la agenda del médico
   */
  async getAgendaMedico(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Si es médico, usar su ID
      let medicoId = req.query.medico_id as string;
      
      if (req.user?.rol === 'medico') {
        // Aquí podríamos necesitar obtener el id del médico basado en el id de usuario
        // Por ahora asumimos que tenemos el ID del médico en el token
        medicoId = req.user.id;
      }
      
      const fecha = req.query.fecha as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Usar getAgendaMedico que sí existe en el servicio
      const result = await citaService.getAgendaMedico(medicoId, fecha ? new Date(fecha) : undefined, page, limit);
      
      return res.status(200).json({
        status: 'success',
        results: result.citas.length,
        data: result.citas,
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
   * Obtiene las citas de un paciente
   */
  async getMisCitas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // El paciente solo puede ver sus propias citas
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'No autorizado'
        });
      }
      
      const pacienteId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Usar getCitasByPacienteId que sí existe en el servicio
      const result = await citaService.getCitasByPacienteId(pacienteId, page, limit);
      
      return res.status(200).json({
        status: 'success',
        results: result.citas.length,
        data: result.citas,
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
   * Actualiza una cita
   */
  async updateCita(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const citaId = req.params.id;
      
      // Verificar si es el paciente de la cita o personal autorizado
      const cita = await citaService.getCitaById(citaId);
      
      if (
        req.user?.rol === 'paciente' && 
        cita.paciente_id !== req.user.id
      ) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para actualizar esta cita'
        });
      }
      
      const updatedCita = await citaService.updateCita(citaId, req.body);
      
      return res.status(200).json({
        status: 'success',
        data: updatedCita
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Marca una cita como atendida
   */
  async marcarCitaAtendida(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const citaId = req.params.id;
      const medicoId = req.user?.id || '';
      
      // Usar marcarCitaAtendida en lugar de updateEstadoCita
      const updatedCita = await citaService.marcarCitaAtendida(citaId, medicoId);
      
      return res.status(200).json({
        status: 'success',
        data: updatedCita
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Marca que un paciente ha llegado
   */
  async marcarPacienteLlegada(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const citaId = req.params.id;
      
      // Usar marcarPacienteLlegada en lugar de updateEstadoCita
      const updatedCita = await citaService.marcarPacienteLlegada(citaId);
      
      return res.status(200).json({
        status: 'success',
        data: updatedCita
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza el estado de una cita
   */
  async updateEstadoCita(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const citaId = req.params.id;
      const { estado } = req.body;
      
      const updatedCita = await citaService.updateEstadoCita(citaId, estado);
      
      return res.status(200).json({
        status: 'success',
        data: updatedCita
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cancela una cita
   */
  async cancelarCita(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const citaId = req.params.id;
      
      // Verificar si es el paciente de la cita o personal autorizado
      const cita = await citaService.getCitaById(citaId);
      
      if (
        req.user?.rol === 'paciente' && 
        cita.paciente_id !== req.user.id
      ) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para cancelar esta cita'
        });
      }
      
      // Usar cancelarCita en lugar de updateEstadoCita
      await citaService.cancelarCita(citaId);
      
      return res.status(200).json({
        status: 'success',
        message: 'Cita cancelada correctamente'
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Usar filtrarCitas que sí existe en el servicio
      const result = await citaService.filtrarCitas(req.query as any, page, limit);
      
      return res.status(200).json({
        status: 'success',
        results: result.citas.length,
        data: result.citas,
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
   * Obtiene la agenda diaria de citas
   */
  async getAgendaDiaria(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const fecha = req.query.fecha ? new Date(req.query.fecha as string) : new Date();
      
      // Usar getAgendaDiaria que sí existe en el servicio
      const citas = await citaService.getAgendaDiaria(fecha);
      
      return res.status(200).json({
        status: 'success',
        results: citas.length,
        data: citas
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene la disponibilidad de un médico
   */
  async getDisponibilidadMedico(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const medicoId = req.params.medicoId;
      const fecha = req.query.fecha as string;
      
      const disponibilidad = await disponibilidadService.getDisponibilidadMedico(medicoId, fecha);
      
      return res.status(200).json({
        status: 'success',
        data: disponibilidad
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Envía recordatorios para citas del día siguiente
   */
  async enviarRecordatorios(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Verificar que el usuario es administrador o tiene permisos
      if (req.user?.rol !== 'admin' && req.user?.rol !== 'admisión') {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para ejecutar esta acción'
        });
      }
      
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