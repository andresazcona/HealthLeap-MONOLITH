import { Request, Response, NextFunction } from 'express';
import usuarioService from '../services/usuario.service';
import citaService from '../services/cita.service';
import { CitaCompleta } from '../models/cita'; // Importar el tipo de cita

class UsuarioController {
  /**
   * Obtiene el perfil del usuario actual
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Req.user debe contener el ID del usuario autenticado
      if (!req.user?.id) {
        res.status(401).json({
          status: 'error',
          message: 'No autenticado'
        });
        return;
      }
      
      const usuario = await usuarioService.getUsuarioById(req.user.id);
      
      res.status(200).json({
        status: 'success',
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza el perfil del usuario actual
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Req.user debe contener el ID del usuario autenticado
      if (!req.user?.id) {
        res.status(401).json({
          status: 'error',
          message: 'No autenticado'
        });
        return;
      }
      
      const updatedUsuario = await usuarioService.updateUsuario(req.user.id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: updatedUsuario
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene un usuario por ID (renombrado de getById)
   */
  async getUsuarioById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = await usuarioService.getUsuarioById(req.params.id);
      
      res.status(200).json({
        status: 'success',
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza un usuario existente (renombrado de update)
   */
  async updateUsuario(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.id;
      
      // Solo administradores pueden actualizar otros usuarios
      if (req.user?.rol !== 'admin' && req.user?.id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para actualizar este usuario'
        });
      }
      
      const updatedUsuario = await usuarioService.updateUsuario(userId, req.body);
      
      res.status(200).json({
        status: 'success',
        data: updatedUsuario
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Elimina un usuario (renombrado de delete)
   */
  async deleteUsuario(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.id;
      
      // Solo administradores pueden eliminar usuarios
      if (req.user?.rol !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para eliminar este usuario'
        });
      }
      
      await usuarioService.deleteUsuario(userId);
      
      res.status(204).json();
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene todos los usuarios con paginación (renombrado de getAll)
   */
  async getAllUsuarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const rol = req.query.rol as string;
      
      const result = await usuarioService.getAllUsuarios(page, limit, rol);
      
      res.status(200).json({
        status: 'success',
        results: result.usuarios.length,
        data: result.usuarios,
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
   * Crea un nuevo usuario
   */
  async createUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nuevoUsuario = await usuarioService.createUsuario(req.body);
      
      // Eliminamos el password_hash de la respuesta por seguridad
      const { password_hash, ...usuarioResponse } = nuevoUsuario;
      
      res.status(201).json({
        status: 'success',
        data: usuarioResponse
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene las citas de un usuario
   */
  async getCitas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.id;
      
      // Verificar permisos
      if (req.user?.rol !== 'admin' && req.user?.id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para ver las citas de este usuario'
        });
      }
      
      const usuario = await usuarioService.getUsuarioById(userId);
      
      // Definir tipo explícito
      let citas: CitaCompleta[] = [];
      
      if (usuario.rol === 'paciente') {
        const result = await citaService.getCitasByPacienteId(userId, 1, 100);
        citas = result.citas;
      } else if (usuario.rol === 'medico') {
        const result = await citaService.getAgendaMedico(userId);
        citas = result.citas;
      }
      
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
   * Cambia la contraseña del usuario
   */
  async cambiarPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.id;
      
      // Solo el propio usuario puede cambiar su contraseña
      if (req.user?.id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'No tienes permiso para cambiar la contraseña de este usuario'
        });
      }
      
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Debe proporcionar la contraseña actual y la nueva'
        });
      }
      
      await usuarioService.cambiarPassword(userId, oldPassword, newPassword);
      
      return res.status(200).json({
        status: 'success',
        message: 'Contraseña actualizada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Mantener métodos anteriores como alias para evitar romper código existente
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.getUsuarioById(req, res, next);
  }
  
  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    return this.updateUsuario(req, res, next);
  }
  
  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    return this.deleteUsuario(req, res, next);
  }
  
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.getAllUsuarios(req, res, next);
  }
}

export default new UsuarioController();