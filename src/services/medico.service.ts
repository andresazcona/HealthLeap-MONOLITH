import medicoRepository from '../repositories/medico.repo';
import usuarioRepository from '../repositories/usuario.repo';
import { Medico, MedicoInput, MedicoUpdateInput, MedicoCompleto, MedicoFiltro } from '../models/medico';
import { UsuarioInput } from '../models/usuario';
import AppError from '../utils/AppError';
import usuarioService from './usuario.service';

class MedicoService {
  /**
   * Crea un nuevo médico junto con su usuario
   */
  async createMedicoCompleto(medicoData: MedicoInput & { usuario: UsuarioInput }): Promise<MedicoCompleto> {
    // 1. Crear el usuario
    const { usuario, ...medicoInfo } = medicoData;
    
    // Asegurarse de que el rol sea médico
    usuario.rol = 'medico';
    
    const newUser = await usuarioService.createUsuario(usuario);
    
    // 2. Crear el médico
    const newMedico = await medicoRepository.create({
      ...medicoInfo,
      usuario_id: newUser.id
    });
    
    // 3. Retornar el médico completo
    return {
      ...newMedico,
      nombre: newUser.nombre,
      email: newUser.email
    };
  }
  
  /**
   * Crea un médico asociado a un usuario existente
   */
  async createMedico(medicoData: MedicoInput): Promise<Medico> {
    // Verificar que el usuario existe y no está ya asociado a un médico
    const usuario = await usuarioRepository.findById(medicoData.usuario_id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }
    
    // Verificar que el usuario no esté ya asociado a un médico
    const medicoExistente = await medicoRepository.findByUsuarioId(medicoData.usuario_id);
    if (medicoExistente) {
      throw new AppError('El usuario ya está registrado como médico', 400);
    }
    
    // Actualizar rol del usuario si es necesario
    if (usuario.rol !== 'medico') {
      // Usar usuarioService en lugar de usuarioRepository directamente
      await usuarioService.updateUsuario(usuario.id, { rol: 'medico' } as any);
    }
    
    return medicoRepository.create(medicoData);
  }
  
  /**
   * Obtiene un médico por ID
   */
  async getMedicoById(id: string): Promise<MedicoCompleto> {
    const medico = await medicoRepository.findCompletoById(id);
    if (!medico) {
      throw new AppError('Médico no encontrado', 404);
    }
    return medico;
  }
  
  /**
   * Obtiene un médico por ID de usuario
   */
  async getMedicoByUsuarioId(usuarioId: string): Promise<MedicoCompleto> {
    const medico = await medicoRepository.findByUsuarioId(usuarioId);
    if (!medico) {
      throw new AppError('Médico no encontrado', 404);
    }
    
    // Obtener información completa
    const medicoCompleto = await medicoRepository.findCompletoById(medico.id);
    if (!medicoCompleto) {
      throw new AppError('Error al obtener información completa del médico', 500);
    }
    
    return medicoCompleto;
  }
  
  /**
   * Actualiza un médico
   */
  async updateMedico(id: string, data: MedicoUpdateInput): Promise<Medico> {
    // Verificar que el médico existe
    const medico = await medicoRepository.findById(id);
    if (!medico) {
      throw new AppError('Médico no encontrado', 404);
    }
    
    return medicoRepository.update(id, data);
  }
  
  /**
   * Elimina un médico
   */
  async deleteMedico(id: string): Promise<boolean> {
    // La validación de si tiene citas asociadas está en el repositorio
    return medicoRepository.delete(id);
  }
  
  /**
   * Busca médicos por especialidad
   */
  async getMedicosByEspecialidad(especialidad: string): Promise<MedicoCompleto[]> {
    return medicoRepository.findByEspecialidad(especialidad);
  }
  
  /**
   * Filtra médicos por diferentes criterios
   */
  async getMedicosByFilters(filtros: MedicoFiltro, page = 1, limit = 10): Promise<{ medicos: MedicoCompleto[], total: number }> {
    return medicoRepository.findByFilters(filtros, page, limit);
  }
  
  /**
   * Obtiene todas las especialidades disponibles
   */
  async getAllEspecialidades(): Promise<string[]> {
    return medicoRepository.getAllEspecialidades();
  }
  
  /**
   * Obtiene todos los médicos con paginación
   */
  async getAllMedicos(page = 1, limit = 10): Promise<{ medicos: MedicoCompleto[], total: number }> {
    return medicoRepository.findByFilters({}, page, limit);
  }
}

export default new MedicoService();