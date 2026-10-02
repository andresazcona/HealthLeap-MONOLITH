import medicoRepository from '../repositories/medico.repo';
import AppError from './AppError';

/**
 * El token trae el id del usuario; las citas y la agenda usan el id del médico.
 */
export async function getMedicoIdDelUsuario(usuarioId: string): Promise<string> {
  const medico = await medicoRepository.findByUsuarioId(usuarioId);
  if (!medico) {
    throw new AppError('El usuario no tiene un perfil de médico', 404);
  }
  return medico.id;
}
