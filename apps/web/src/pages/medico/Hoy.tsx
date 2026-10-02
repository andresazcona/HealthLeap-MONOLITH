import { Fragment } from 'react';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import HourglassTopRounded from '@mui/icons-material/HourglassTopRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import { get, patch, qs } from '../../lib/api';
import { fechaLarga, hora, hoyMas, mediodia } from '../../lib/fechas';
import { mensaje, useNotificar } from '../../lib/notificar';
import type { Cita, Disponibilidad, Medico } from '../../lib/types';
import { Encabezado } from '../../components/Encabezado';
import { EstadoChip } from '../../components/EstadoChip';
import { Consulta, Vacio } from '../../components/Estados';
import { Iniciales } from '../../components/Iniciales';
import { Contadores } from '../../components/staff/Comun';
import { capital, rayado } from '../../components/staff/util';

type Item = { t: number; cita?: Cita; bloque?: { inicio: string; fin: string } };

export default function Hoy() {
  const hoy = hoyMas(0);
  const qc = useQueryClient();
  const notificar = useNotificar();

  const q = useQuery({
    queryKey: ['citas', 'medico', 'agenda', hoy],
    queryFn: () => get<Cita[]>(`/api/citas/medico/agenda${qs({ fecha: hoy, limit: 100 })}`),
    refetchInterval: 30_000,
  });
  const perfil = useQuery({ queryKey: ['medicos', 'perfil'], queryFn: () => get<Medico>('/api/medicos/perfil') });
  const disp = useQuery({
    queryKey: ['disponibilidad', perfil.data?.id, hoy],
    queryFn: () => get<Disponibilidad>(`/api/disponibilidad/medico/${perfil.data!.id}/fecha/${hoy}`),
    enabled: Boolean(perfil.data),
  });

  const atender = useMutation({
    mutationFn: (id: string) => patch(`/api/citas/${id}/atendida`),
    onSuccess: () => {
      notificar('Cita marcada como atendida');
      qc.invalidateQueries({ queryKey: ['citas'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad'] });
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  return (
    <>
      <Encabezado antetitulo="Médico" titulo="Mi día" subtitulo={capital(fechaLarga(mediodia(hoy)))} />
      <Consulta q={q} filas={4}>
        {citas => {
          const cuenta = (e: Cita['estado']) => citas.filter(c => c.estado === e).length;
          const espera = citas.filter(c => c.estado === 'en espera').sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
          const ahora = q.dataUpdatedAt || Date.now();
          const items: Item[] = [
            ...citas.map(c => ({ t: Date.parse(c.fecha_hora), cita: c })),
            ...(disp.data?.bloquesBloqueados ?? []).map(b => ({ t: Date.parse(b.inicio), bloque: b })),
          ].sort((a, b) => a.t - b.t);
          const idxAhora = items.findIndex(i => i.t > ahora);

          return (
            <>
              <Contadores items={[
                { etiqueta: 'Programadas', valor: cuenta('agendada'), estado: 'agendada' },
                { etiqueta: 'En espera', valor: cuenta('en espera'), estado: 'en espera' },
                { etiqueta: 'Atendidas', valor: cuenta('atendida'), estado: 'atendida' },
                { etiqueta: 'Canceladas', valor: cuenta('cancelada'), estado: 'cancelada' },
              ]} />

              <Card sx={{ mb: 4, borderColor: espera.length ? 'warning.main' : undefined, bgcolor: espera.length ? 'action.hover' : undefined }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: espera.length ? 2 : 0.5 }}>
                    <HourglassTopRounded color="warning" />
                    <Typography variant="h3" component="h2">Sala de espera</Typography>
                    {espera.length > 0 && <Chip size="small" color="warning" label={espera.length} />}
                  </Stack>
                  {espera.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Nadie en sala por ahora. Cuando recepción marque una llegada, aparecerá aquí.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(260px, 1fr))' }, gap: 1.5 }}>
                      {espera.map(c => (
                        <Card key={c.id} sx={{ p: 2 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <Iniciales nombre={c.nombre_paciente} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="h4" noWrap>{c.nombre_paciente}</Typography>
                              <Typography variant="body2" color="text.secondary">Cita programada: {hora(c.fecha_hora)}</Typography>
                            </Box>
                          </Stack>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<CheckCircleRounded />}
                            disabled={atender.isPending}
                            onClick={() => atender.mutate(c.id)}
                          >
                            {atender.isPending && atender.variables === c.id ? 'Guardando…' : 'Marcar atendida'}
                          </Button>
                        </Card>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Typography variant="h3" component="h2" sx={{ mb: 0.5 }}>Cronograma del día</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Se actualiza cada 30 segundos · última vez {hora(new Date(ahora).toISOString())}
              </Typography>

              {citas.length === 0 ? (
                <Card><Vacio titulo="No tienes citas hoy" texto="Cuando un paciente agende contigo para hoy, la verás en este cronograma." /></Card>
              ) : (
                <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, position: 'relative', '&::before': { content: '""', position: 'absolute', left: 100, top: 8, bottom: 8, width: 2, bgcolor: 'divider' } }}>
                  {items.map((i, n) => (
                    <Fragment key={i.cita?.id ?? `b${i.t}`}>
                      {n === idxAhora && <LineaAhora ahora={ahora} />}
                      <Fila item={i} />
                    </Fragment>
                  ))}
                  {idxAhora === -1 && <LineaAhora ahora={ahora} />}
                </Box>
              )}
            </>
          );
        }}
      </Consulta>
    </>
  );
}

function LineaAhora({ ahora }: { ahora: number }) {
  return (
    <Box component="li" aria-label="Hora actual" sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1.5, position: 'relative' }}>
      <Typography variant="caption" color="primary" fontWeight={600} sx={{ width: 76, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {hora(new Date(ahora).toISOString())}
      </Typography>
      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', ml: '11px', flexShrink: 0, zIndex: 1 }} />
      <Box sx={{ flex: 1, height: 2, bgcolor: 'primary.main' }} />
      <Typography variant="overline" color="primary">Ahora</Typography>
    </Box>
  );
}

function Fila({ item: { cita, bloque } }: { item: Item }) {
  const inicio = cita?.fecha_hora ?? bloque!.inicio;
  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
      <Typography variant="body2" fontWeight={600} sx={{ width: 76, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', pt: 1.75 }}>{hora(inicio)}</Typography>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cita ? 'background.paper' : 'text.disabled', border: 2, borderColor: cita ? 'primary.main' : 'text.disabled', ml: '10px', mt: 2.25, flexShrink: 0, zIndex: 1 }} />
      {cita ? (
        <Card sx={{ flex: 1, minWidth: 0, px: 2, py: 1.5, opacity: cita.estado === 'cancelada' ? 0.6 : 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" noWrap sx={{ textDecoration: cita.estado === 'cancelada' ? 'line-through' : undefined }}>{cita.nombre_paciente}</Typography>
              <Typography variant="caption" color="text.secondary">{hora(cita.fecha_hora)} · {cita.duracion_cita} min</Typography>
            </Box>
            <EstadoChip estado={cita.estado} />
          </Stack>
        </Card>
      ) : (
        <Box sx={t => ({ flex: 1, px: 2, py: 1.5, borderRadius: 3, border: 1, borderColor: 'divider', ...rayado(t) })}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LockRounded fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600}>Horario bloqueado</Typography>
            <Typography variant="body2" color="text.secondary">{hora(bloque!.inicio)} – {hora(bloque!.fin)}</Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
