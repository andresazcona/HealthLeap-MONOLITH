import { Request, Response, NextFunction } from 'express';
import medicoService from '../services/medico.service';
import disponibilidadService from '../services/disponibilidad.service';

class MedicoController {
  /**
   * Obtiene todos los médicos (para administradores)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filtros = {
        especialidad: req.query.especialidad as string,
        centro_id: req.query.centro_id as string
      };
      
      const result = await medicoService.getMedicosByFilters(filtros, page, limit);
      
      res.status(200).json({
        status: 'success',
        results: result.medicos.length,
        data: result.medicos,
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
   * Obtiene un médico por su ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const medico = await medicoService.getMedicoById(req.params.id);
      
      res.status(200).json({
        status: 'success',
        data: medico
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene médicos por especialidad
   */
  async getByEspecialidad(req: Request, res: Response, next: NextFunction) {
    try {
      const medicos = await medicoService.getMedicosByEspecialidad(req.params.especialidad);
      
      res.status(200).json({
        status: 'success',
        results: medicos.length,
        data: medicos
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Busca médicos por filtros (para ruta pública)
   */
  async getByFilters(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filtros = {
        especialidad: req.query.especialidad as string,
        centro_id: req.query.centro_id as string,
        nombre: req.query.nombre as string
      };
      
      const result = await medicoService.getMedicosByFilters(filtros, page, limit);
      
      res.status(200).json({
        status: 'success',
        results: result.medicos.length,
        data: result.medicos,
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
   * Crea un nuevo médico
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      let medico;
      
      // Determinar qué método usar basado en si hay datos de usuario
      if (req.body.usuario) {
        // Crear médico con usuario nuevo
        medico = await medicoService.createMedicoCompleto(req.body);
      } else {
        // Crear médico con usuario existente
        medico = await medicoService.createMedico(req.body);
      }
      
      res.status(201).json({
        status: 'success',
        data: medico
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza un médico existente
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedMedico = await medicoService.updateMedico(req.params.id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: updatedMedico
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Elimina un médico
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await medicoService.deleteMedico(req.params.id);
      
      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza la duración de cita de un médico
   */
  async updateDuracionCita(req: Request, res: Response, next: NextFunction) {
    try {
      const { duracion_cita } = req.body;
      
      const updatedMedico = await medicoService.updateMedico(
        req.params.id,
        { duracion_cita }
      );
      
      res.status(200).json({
        status: 'success',
        data: updatedMedico
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene la agenda/disponibilidad de un médico
   */
  async getAgenda(req: Request, res: Response, next: NextFunction) {
    try {
      const medicoId = req.params.id;
      const fecha = req.query.fecha as string;
      
      const agenda = await disponibilidadService.getDisponibilidadMedico(medicoId, fecha);
      
      res.status(200).json({
        status: 'success',
        data: agenda
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene todas las especialidades disponibles
   */
  async getAllEspecialidades(req: Request, res: Response, next: NextFunction) {
    try {
      const especialidades = await medicoService.getAllEspecialidades();
      
      res.status(200).json({
        status: 'success',
        data: especialidades
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene el perfil del médico autenticado
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // Asumiendo que el middleware de autenticación establece req.user
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'No autenticado'
        });
      }
      
      // Obtener médico por ID de usuario
      const medico = await medicoService.getMedicoByUsuarioId(userId);
      
      res.status(200).json({
        status: 'success',
        data: medico
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MedicoController();