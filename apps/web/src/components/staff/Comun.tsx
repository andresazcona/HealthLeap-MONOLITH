import { Box, Button, Card, IconButton, Stack, TextField, Tooltip, Typography, useTheme } from '@mui/material';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { estadoColores } from '../../theme';
import { hoyMas } from '../../lib/fechas';
import type { EstadoCita } from '../../lib/types';
import { sumarDias } from './util';

/** Fila de contadores; el color del punto sigue el estado de la cita. */
export function Contadores({ items }: { items: { etiqueta: string; valor: number; estado?: EstadoCita }[] }) {
  const modo = useTheme().palette.mode;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: `repeat(${items.length}, 1fr)` }, gap: 1.5, mb: 3 }}>
      {items.map(i => (
        <Card key={i.etiqueta} sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            {i.estado && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: estadoColores[modo][i.estado].dot }} />}
            <Typography variant="caption" color="text.secondary">{i.etiqueta}</Typography>
          </Stack>
          <Typography sx={{ fontSize: 26, fontWeight: 600, lineHeight: 1.3 }}>{i.valor}</Typography>
        </Card>
      ))}
    </Box>
  );
}

/** Día anterior / selector / siguiente / Hoy. */
export function NavFecha({ fecha, onFecha, min }: { fecha: string; onFecha: (f: string) => void; min?: string }) {
  const hoy = hoyMas(0);
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Tooltip title="Día anterior">
        <span>
          <IconButton onClick={() => onFecha(sumarDias(fecha, -1))} disabled={Boolean(min && fecha <= min)} aria-label="Día anterior">
            <ChevronLeftRounded />
          </IconButton>
        </span>
      </Tooltip>
      <TextField
        type="date"
        value={fecha}
        onChange={e => e.target.value && onFecha(min && e.target.value < min ? min : e.target.value)}
        slotProps={{ htmlInput: { min, 'aria-label': 'Fecha' } }}
        sx={{ width: 170 }}
      />
      <Tooltip title="Día siguiente">
        <IconButton onClick={() => onFecha(sumarDias(fecha, 1))} aria-label="Día siguiente"><ChevronRightRounded /></IconButton>
      </Tooltip>
      <Button variant="outlined" onClick={() => onFecha(hoy)} disabled={fecha === hoy}>Hoy</Button>
    </Stack>
  );
}
