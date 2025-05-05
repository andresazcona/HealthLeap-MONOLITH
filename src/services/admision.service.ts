import admisionRepository from '../repositories/admision.repo';
import usuarioRepository from '../repositories/usuario.repo';
import { Admision, AdmisionInput, AdmisionUpdateInput, AdmisionCompleto } from '../models/admision';
import { UsuarioInput } from '../models/usuario';
import AppError from '../utils/AppError';
import usuarioService from './usuario.service';

class AdmisionService {
  /**
   * Crea un nuevo personal de admisión junto con su usuario
   */
  async createAdmisionCompleto(admisionData: AdmisionInput & { usuario: UsuarioInput }): Promise<AdmisionCompleto> {
    // 1. Crear el usuario
    const { usuario, ...admisionInfo } = admisionData;
    
    // Asegurarse de que el rol sea admisión
    usuario.rol = 'admisión';
    
    const newUser = await usuarioService.createUsuario(usuario);
    
    // 2. Crear el personal de admisión
    const newAdmision = await admisionRepository.create({
      ...admisionInfo,
      usuario_id: newUser.id
    });
    
    // 3. Retornar la información completa
    return {
      ...newAdmision,
      nombre: newUser.nombre,
      email: newUser.email
    };
  }
  
  /**
   * Crea un personal de admisión asociado a un usuario existente
   */
  async createAdmision(admisionData: AdmisionInput): Promise<Admision> {
    // Verificar que el usuario existe y no está ya asociado
    const usuario = await usuarioRepository.findById(admisionData.usuario_id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }
    
    // Verificar que no esté ya asociado a un registro de admisión
    const admisionExistente = await admisionRepository.findByUsuarioId(admisionData.usuario_id);
    if (admisionExistente) {
      throw new AppError('El usuario ya está registrado como personal de admisión', 400);
    }
    
    // Actualizar rol del usuario si es necesario
    if (usuario.rol !== 'admisión') {
      // Usar usuarioService en lugar de usuarioRepository directamente
      await usuarioService.updateUsuario(usuario.id, { rol: 'admisión' } as any);
    }
    
    return admisionRepository.create(admisionData);
  }
  
  /**
   * Obtiene un personal de admisión por ID
   */
  async getAdmisionById(id: string): Promise<AdmisionCompleto> {
    const admision = await admisionRepository.findCompletoById(id);
    if (!admision) {
      throw new AppError('Personal de admisión no encontrado', 404);
    }
    return admision;
  }
  
  /**
   * Obtiene un personal de admisión por ID de usuario
   */
  async getAdmisionByUsuarioId(usuarioId: string): Promise<AdmisionCompleto> {
    const admision = await admisionRepository.findByUsuarioId(usuarioId);
    if (!admision) {
      throw new AppError('Personal de admisión no encontrado', 404);
    }
    
    // Obtener información completa
    const admisionCompleto = await admisionRepository.findCompletoById(admision.id);
    if (!admisionCompleto) {
      throw new AppError('Error al obtener información completa del personal de admisión', 500);
    }
    
    return admisionCompleto;
  }
  
  /**
   * Actualiza un personal de admisión
   */
  async updateAdmision(id: string, data: AdmisionUpdateInput): Promise<Admision> {
    // Verificar que existe
    const admision = await admisionRepository.findById(id);
    if (!admision) {
      throw new AppError('Personal de admisión no encontrado', 404);
    }
    
    return admisionRepository.update(id, data);
  }
  
  /**
   * Elimina un personal de admisión
   */
  async deleteAdmision(id: string): Promise<boolean> {
    return admisionRepository.delete(id);
  }
  
  /**
   * Obtiene todos los personales de admisión con paginación
   */
  async getAllAdmisiones(page = 1, limit = 10): Promise<{ admisiones: AdmisionCompleto[], total: number }> {
    return admisionRepository.findAll(page, limit);
  }
  
  /**
   * Obtiene todas las áreas disponibles
   */
  async getAllAreas(): Promise<string[]> {
    return admisionRepository.getAllAreas();
  }
}

export default new AdmisionService();