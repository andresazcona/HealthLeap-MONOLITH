import { Alert, Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { mensaje } from '../lib/notificar';

/** Ilustración mínima de calendario en trazo teal, para estados vacíos. */
function Ilustracion() {
  return (
    <Box component="svg" viewBox="0 0 96 96" sx={{ width: 88, height: 88, color: 'primary.main' }} aria-hidden="true">
      <rect x="16" y="22" width="64" height="56" rx="10" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M16 38h64M34 14v14M62 14v14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 58l7 7 14-14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".5" />
    </Box>
  );
}

export function Vacio({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 6, px: 2, textAlign: 'center' }}>
      <Ilustracion />
      <Typography variant="h4">{titulo}</Typography>
      {texto && <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>{texto}</Typography>}
      {accion}
    </Stack>
  );
}

export function Cargando({ filas = 3, alto = 56 }: { filas?: number; alto?: number }) {
  return (
    <Stack spacing={1} aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => <Skeleton key={i} variant="rounded" height={alto} />)}
    </Stack>
  );
}

export function ErrorCarga({ error, reintentar }: { error: unknown; reintentar?: () => void }) {
  return (
    <Alert severity="error" action={reintentar && <Button color="inherit" size="small" onClick={reintentar}>Reintentar</Button>}>
      {mensaje(error)}
    </Alert>
  );
}

/** Envuelve una consulta: cargando, error, vacío o contenido. */
export function Consulta<T>({ q, vacio, children, filas }: {
  q: { isLoading: boolean; error: unknown; data: T | undefined; refetch: () => unknown };
  vacio?: ReactNode;
  filas?: number;
  children: (data: T) => ReactNode;
}) {
  if (q.isLoading) return <Cargando filas={filas} />;
  if (q.error) return <ErrorCarga error={q.error} reintentar={() => q.refetch()} />;
  if (q.data === undefined) return null;
  if (vacio && Array.isArray(q.data) && q.data.length === 0) return <>{vacio}</>;
  return <>{children(q.data)}</>;
}
