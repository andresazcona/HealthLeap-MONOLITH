import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';

type Tipo = 'success' | 'error' | 'info' | 'warning';
const Ctx = createContext<(msg: string, tipo?: Tipo) => void>(() => {});

/** Snackbars de éxito/error para toda la app. */
export function NotificarProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ msg: string; tipo: Tipo; key: number } | null>(null);
  const notificar = useCallback((msg: string, tipo: Tipo = 'success') => setAviso({ msg, tipo, key: Date.now() }), []);
  return (
    <Ctx.Provider value={notificar}>
      {children}
      <Snackbar
        key={aviso?.key}
        open={Boolean(aviso)}
        autoHideDuration={4500}
        onClose={() => setAviso(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={aviso?.tipo} variant="filled" onClose={() => setAviso(null)} sx={{ width: '100%' }}>
          {aviso?.msg}
        </Alert>
      </Snackbar>
    </Ctx.Provider>
  );
}

export const useNotificar = () => useContext(Ctx);

/** Mensaje legible de cualquier error. */
export const mensaje = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado');
