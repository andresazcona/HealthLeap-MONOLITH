import { Box, Stack, Typography, useTheme } from '@mui/material';
import LockRounded from '@mui/icons-material/LockRounded';
import { estadoColores } from '../../theme';
import { aUtc, esFutura, hora } from '../../lib/fechas';
import type { Disponibilidad } from '../../lib/types';
import { FILAS, JORNADA, hhmm, minCol, rayado } from './util';

export interface ColumnaFranjas { id: string; titulo: string; subtitulo?: string; disp: Disponibilidad }

const enFila = (iso: string, fila: number) => { const m = minCol(iso); return m >= fila && m < fila + JORNADA.paso; };

/** Leyenda de la matriz. */
export function LeyendaFranjas() {
  const t = useTheme();
  const c = estadoColores[t.palette.mode];
  const item = (sx: object, texto: string) => (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ width: 14, height: 14, borderRadius: 0.75, border: 1, borderColor: 'divider', ...sx }} />
      <Typography variant="caption" color="text.secondary">{texto}</Typography>
    </Stack>
  );
  return (
    <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }} aria-label="Leyenda">
      {item({ bgcolor: 'background.paper' }, 'Libre')}
      {item({ bgcolor: c.agendada.bg }, 'Ocupado')}
      {item(rayado(t), 'Bloqueado')}
    </Stack>
  );
}

/**
 * Filas de 30 min (hora de Colombia) × una columna por médico.
 * Cada franja o cita se ubica en la fila de su hora de inicio (sirve para duraciones de 20 o 30 min).
 */
export function MatrizFranjas({ fecha, columnas }: { fecha: string; columnas: ColumnaFranjas[] }) {
  const t = useTheme();
  const ocupado = estadoColores[t.palette.mode].agendada;
  const plantilla = `72px repeat(${columnas.length}, minmax(168px, 1fr))`;
  const celda = { borderTop: 1, borderLeft: 1, borderColor: 'divider', p: 0.75, minHeight: 52 };

  return (
    <Box sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
      <Box role="table" aria-label="Disponibilidad por franja" sx={{ display: 'grid', gridTemplateColumns: plantilla, minWidth: 'fit-content' }}>
        <Box role="row" sx={{ display: 'contents' }}>
          <Box role="columnheader" sx={{ p: 1.5, bgcolor: 'action.hover', position: 'sticky', left: 0, zIndex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Hora</Typography>
          </Box>
          {columnas.map(col => (
            <Box key={col.id} role="columnheader" sx={{ p: 1.5, bgcolor: 'action.hover', borderLeft: 1, borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={600} noWrap>{col.titulo}</Typography>
              {col.subtitulo && <Typography variant="caption" color="text.secondary" noWrap component="div">{col.subtitulo}</Typography>}
            </Box>
          ))}
        </Box>

        {FILAS.map(fila => {
          const desde = aUtc(fecha, hhmm(fila));
          const hasta = aUtc(fecha, hhmm(fila + JORNADA.paso));
          return (
            <Box role="row" key={fila} sx={{ display: 'contents' }}>
              <Box role="rowheader" sx={{ ...celda, borderLeft: 0, position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper' }}>
                <Typography variant="caption" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>{hora(desde)}</Typography>
              </Box>
              {columnas.map(({ id, disp }) => {
                const citas = disp.citasAgendadas.filter(c => enFila(String(c.inicio), fila));
                const libres = disp.bloquesDisponibles.filter(b => enFila(b.inicio, fila));
                const bloqueado = disp.bloquesBloqueados.some(b => b.inicio < hasta && b.fin > desde);
                const vacia = citas.length === 0 && libres.length === 0;
                return (
                  <Box role="cell" key={id} sx={{ ...celda, display: 'flex', flexDirection: 'column', gap: 0.5, ...(bloqueado && vacia && rayado(t)) }}>
                    {citas.map(c => (
                      <Box key={c.id} sx={{ bgcolor: ocupado.bg, color: ocupado.fg, borderRadius: 1, px: 1, py: 0.5 }}>
                        <Typography variant="caption" fontWeight={600} component="div" noWrap>{c.paciente}</Typography>
                        <Typography variant="caption" component="div">Ocupado · {hora(String(c.inicio))}</Typography>
                      </Box>
                    ))}
                    {libres.map(b => (
                      <Typography key={b.inicio} variant="caption" color="text.secondary" sx={{ px: 1, opacity: esFutura(b.inicio) ? 1 : 0.5 }}>
                        Libre · {hora(b.inicio)}
                      </Typography>
                    ))}
                    {bloqueado && (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 1, color: 'text.secondary' }}>
                        <LockRounded sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600}>Bloqueado</Typography>
                      </Stack>
                    )}
                    {vacia && !bloqueado && <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>—</Typography>}
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
