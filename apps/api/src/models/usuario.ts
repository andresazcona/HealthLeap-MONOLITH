export type RolUsuario = 'paciente' | 'medico' | 'admisión' | 'admin';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: RolUsuario;
  created_at: Date;
}

export interface UsuarioInput {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
}

export interface UsuarioUpdateInput {
  nombre?: string;
  email?: string;
  password?: string;
}

export interface UsuarioLoginInput {
  email: string;
  password: string;
}

export interface UsuarioOutput {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  created_at: Date;
}

export interface TokenPayload {
  id: string;
  rol: RolUsuario;
}

export interface AuthResponse {
  user: UsuarioOutput;
  accessToken: string;
  refreshToken: string;
}