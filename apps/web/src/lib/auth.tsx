import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { get, post, setToken, getToken } from './api';
import type { Rol, Usuario } from './types';

interface AuthCtx {
  user: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  registrar: (nombre: string, email: string, password: string) => Promise<Usuario>;
  logout: () => void;
  refrescar: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(Boolean(getToken()));

  const refrescar = useCallback(async () => {
    setUser(await get<Usuario>('/api/usuarios/me'));
  }, []);

  useEffect(() => {
    if (getToken()) refrescar().catch(() => setToken(null)).finally(() => setCargando(false));
    const salir = () => setUser(null);
    window.addEventListener('hl:logout', salir);
    return () => window.removeEventListener('hl:logout', salir);
  }, [refrescar]);

  const entrar = (data: { user: Usuario; accessToken: string }) => {
    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const value: AuthCtx = {
    user,
    cargando,
    login: async (email, password) => entrar(await post('/api/auth/login', { email, password })),
    registrar: async (nombre, email, password) => entrar(await post('/api/auth/register', { nombre, email, password })),
    logout: () => { setToken(null); setUser(null); },
    refrescar,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
};

export const inicioPorRol: Record<Rol, string> = {
  paciente: '/paciente',
  medico: '/medico',
  'admisión': '/admision',
  admin: '/admin',
};

export const nombreRol: Record<Rol, string> = {
  paciente: 'Paciente',
  medico: 'Médico',
  'admisión': 'Admisión',
  admin: 'Administrador',
};
