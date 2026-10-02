import { useState } from 'react';
import {
  Box, Button, ButtonBase, Card, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { get, qs } from '../../lib/api';
import { diaMes, diaSemana, fechaCorta, fechaLarga, hora, hoyMas, mediodia } from '../../lib/fechas';
import type { Cita } from '../../lib/types';
import { Encabezado } from '../../components/Encabezado';
import { EstadoChip } from '../../components/EstadoChip';
import { Consulta } from '../../components/Estados';
import { capital, diaCol, sumarDias } from '../../components/staff/util';

/** Lunes de la semana de una fecha YYYY-MM-DD. */
const lunesDe = (f: string) => sumarDias(f, -((new Date(`${f}T12:00:00Z`).getUTCDay() + 6) % 7));

export default function Agenda() {
  const hoy = hoyMas(0);
  const [lunes, setLunes] = useState(() => lunesDe(hoy));
  const [detalle, setDetalle] = useState<Cita | null>(null);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  // ponytail: trae hasta 200 citas y filtra la semana en el cliente; pedir por rango si la API lo soporta.
  const q = useQuery({
    queryKey: ['citas', 'medico', 'agenda', 'todas'],
    queryFn: () => get<Cita[]>(`/api/citas/medico/agenda${qs({ limit: 200 })}`),
    refetchInterval: 60_000,
  });

  return (
    <>
      <Encabezado
        antetitulo="Médico"
        titulo="Agenda semanal"
        subtitulo={`${fechaCorta(mediodia(dias[0]))} – ${fechaCorta(mediodia(dias[6]))}`}
        acciones={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Semana anterior">
              <IconButton onClick={() => setLunes(sumarDias(lunes, -7))} aria-label="Semana anterior"><ChevronLeftRounded /></IconButton>
            </Tooltip>
            <Button variant="outlined" onClick={() => setLunes(lunesDe(hoy))} disabled={lunes === lunesDe(hoy)}>Hoy</Button>
            <Tooltip title="Semana siguiente">
              <IconButton onClick={() => setLunes(sumarDias(lunes, 7))} aria-label="Semana siguiente"><ChevronRightRounded /></IconButton>
            </Tooltip>
          </Stack>
        }
      />

      <Consulta q={q} filas={5}>
        {citas => (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(7, minmax(0, 1fr))' }, gap: { xs: 2, md: 1 } }}>
            {dias.map(d => {
              const delDia = citas.filter(c => diaCol(c.fecha_hora) === d).sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
              const esHoy = d === hoy;
              return (
                <Box key={d} component="section" aria-label={fechaLarga(mediodia(d))}>
                  <Stack
                    direction={{ xs: 'row', md: 'column' }}
                    spacing={{ xs: 1, md: 0 }}
                    alignItems={{ xs: 'baseline', md: 'center' }}
                    sx={{
                      py: 1, px: 1.5, mb: 1, borderRadius: 2,
                      bgcolor: esHoy ? 'primary.main' : 'action.hover', color: esHoy ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Typography variant="overline" sx={{ textTransform: 'capitalize', opacity: 0.85 }}>{diaSemana(mediodia(d))}</Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 18 }}>{diaMes(mediodia(d))}</Typography>
                    <Typography variant="caption" sx={{ ml: 'auto !important', display: { md: 'none' }, opacity: 0.85 }}>
                      {delDia.length} {delDia.length === 1 ? 'cita' : 'citas'}
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {delDia.length === 0 && (
                      <Typography variant="caption" color="text.disabled" sx={{ textAlign: { md: 'center' }, px: 1.5 }}>Sin citas</Typography>
                    )}
                    {delDia.map(c => (
                      <Card key={c.id} sx={{ opacity: c.estado === 'cancelada' ? 0.6 : 1 }}>
                        <ButtonBase
                          onClick={() => setDetalle(c)}
                          sx={{ display: 'block', width: '100%', textAlign: 'left', p: 1.25 }}
                          aria-label={`${hora(c.fecha_hora)} ${c.nombre_paciente}`}
                        >
                          <Typography variant="body2" fontWeight={600} noWrap>{hora(c.fecha_hora)}</Typography>
                          <Typography variant="body2" noWrap title={c.nombre_paciente} sx={{ mb: 0.75 }}>{c.nombre_paciente}</Typography>
                          <EstadoChip estado={c.estado} />
                        </ButtonBase>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        )}
      </Consulta>

      <Dialog open={Boolean(detalle)} onClose={() => setDetalle(null)} maxWidth="xs" fullWidth>
        {detalle && (
          <>
            <DialogTitle sx={{ fontWeight: 600 }}>{detalle.nombre_paciente}</DialogTitle>
            <DialogContent>
              <Stack spacing={1.5}>
                <EstadoChip estado={detalle.estado} />
                {[
                  ['Fecha', capital(fechaLarga(detalle.fecha_hora))],
                  ['Hora', `${hora(detalle.fecha_hora)} · ${detalle.duracion_cita} min`],
                  ['Especialidad', detalle.especialidad],
                  ['Correo del paciente', detalle.email_paciente || '—'],
                ].map(([k, v]) => (
                  <Box key={String(k)}>
                    <Typography variant="caption" color="text.secondary">{k}</Typography>
                    <Typography variant="body2">{v}</Typography>
                  </Box>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button variant="outlined" onClick={() => setDetalle(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
