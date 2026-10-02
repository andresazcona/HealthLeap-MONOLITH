import { Box, Button, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import { diaMes, diaSemana, esFutura, fechaLarga, hora, hoyMas, mediodia } from '../lib/fechas';
import type { Disponibilidad } from '../lib/types';
import { Cargando, ErrorCarga } from './Estados';

const DIAS = 14;

/** Tira de días + grilla de horarios libres de un médico. */
export function SelectorHorario({ medicoId, fecha, onFecha, seleccion, onSeleccion }: {
  medicoId: string;
  fecha: string;
  onFecha: (f: string) => void;
  seleccion: string | null;
  onSeleccion: (inicio: string) => void;
}) {
  const q = useQuery({
    queryKey: ['disponibilidad', medicoId, fecha],
    queryFn: () => get<Disponibilidad>(`/api/disponibilidad/medico/${medicoId}/fecha/${fecha}`),
    enabled: Boolean(medicoId),
  });
  const libres = (q.data?.bloquesDisponibles ?? []).filter(b => esFutura(b.inicio));

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, scrollbarWidth: 'thin' }} role="listbox" aria-label="Día de la cita">
        {Array.from({ length: DIAS }, (_, i) => hoyMas(i)).map(f => {
          const activo = f === fecha;
          return (
            <Button
              key={f}
              role="option"
              aria-selected={activo}
              aria-label={fechaLarga(mediodia(f))}
              onClick={() => onFecha(f)}
              variant={activo ? 'contained' : 'outlined'}
              sx={{ flexDirection: 'column', minWidth: 64, py: 1, lineHeight: 1.2, flexShrink: 0 }}
            >
              <Typography component="span" variant="caption" sx={{ textTransform: 'capitalize', opacity: 0.85 }}>
                {diaSemana(mediodia(f))}
              </Typography>
              <Typography component="span" sx={{ fontWeight: 600, fontSize: 18 }}>{diaMes(mediodia(f))}</Typography>
            </Button>
          );
        })}
      </Box>

      {q.isLoading ? <Cargando filas={2} alto={44} /> : q.error ? <ErrorCarga error={q.error} reintentar={() => q.refetch()} /> : (
        libres.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
            No hay horarios libres este día. Prueba con otra fecha.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 1 }} role="listbox" aria-label="Hora de la cita">
            {libres.map(b => {
              const activo = b.inicio === seleccion;
              return (
                <Button
                  key={b.inicio}
                  role="option"
                  aria-selected={activo}
                  onClick={() => onSeleccion(b.inicio)}
                  variant="outlined"
                  sx={{
                    minHeight: 44, whiteSpace: 'nowrap',
                    ...(activo && { bgcolor: 'primary.main', color: 'primary.contrastText', borderColor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }),
                  }}
                >
                  {hora(b.inicio)}
                </Button>
              );
            })}
          </Box>
        )
      )}
    </Stack>
  );
}
