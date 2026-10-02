import { Box, useTheme } from '@mui/material';
import { estadoColores } from '../theme';
import type { EstadoCita } from '../lib/types';

const etiqueta: Record<EstadoCita, string> = {
  agendada: 'Agendada',
  'en espera': 'En espera',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
};

export function EstadoChip({ estado }: { estado: EstadoCita }) {
  const c = estadoColores[useTheme().palette.mode][estado];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 24, px: 1.25, borderRadius: 999,
        bgcolor: c.bg, color: c.fg, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap',
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot }} />
      {etiqueta[estado]}
    </Box>
  );
}
