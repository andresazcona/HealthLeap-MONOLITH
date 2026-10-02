import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { crearTema } from '../theme';

type Modo = 'light' | 'dark';
const Ctx = createContext<{ modo: Modo; alternar: () => void }>({ modo: 'light', alternar: () => {} });
const KEY = 'hl_modo';

export function ModoProvider({ children }: { children: ReactNode }) {
  const prefiereOscuro = useMediaQuery('(prefers-color-scheme: dark)');
  const [guardado, setGuardado] = useState<Modo | null>(() => {
    try { return (localStorage.getItem(KEY) as Modo) || null; } catch { return null; }
  });
  const modo: Modo = guardado ?? (prefiereOscuro ? 'dark' : 'light');
  const tema = useMemo(() => crearTema(modo), [modo]);
  const alternar = () => {
    const nuevo = modo === 'light' ? 'dark' : 'light';
    setGuardado(nuevo);
    try { localStorage.setItem(KEY, nuevo); } catch { /* sin almacenamiento */ }
  };
  return (
    <Ctx.Provider value={{ modo, alternar }}>
      <ThemeProvider theme={tema}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Ctx.Provider>
  );
}

export const useModo = () => useContext(Ctx);
