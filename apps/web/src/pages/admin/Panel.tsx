import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Chip, Stack, TextField, Typography, useTheme } from '@mui/material';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import MedicalServicesRounded from '@mui/icons-material/MedicalServicesRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import AssessmentRounded from '@mui/icons-material/AssessmentRounded';
import { Encabezado } from '../../components/Encabezado';
import { EstadoChip } from '../../components/EstadoChip';
import { Consulta, Vacio } from '../../components/Estados';
import { get, qs } from '../../lib/api';
import { aUtc, esFutura, fechaCorta, hora, hoyMas } from '../../lib/fechas';
import type { EstadoCita, FilaReporte, Resumen } from '../../lib/types';
import { estadoColores } from '../../theme';

type Preset = 'hoy' | 'semana' | 'mes' | 'todo';

function rango(p: Preset): [string, string] {
  const hoy = hoyMas();
  if (p === 'hoy') return [hoy, hoy];
  if (p === 'semana') return [hoy, hoyMas(6)];
  if (p === 'mes') {
    const [y, m] = hoy.split('-').map(Number);
    const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return [`${hoy.slice(0, 8)}01`, `${hoy.slice(0, 8)}${String(ultimo).padStart(2, '0')}`];
  }
  return ['', ''];
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Próximos 7 días' },
  { id: 'mes', label: 'Este mes' },
  { id: 'todo', label: 'Todo' },
];

const ACCESOS = [
  { to: '/admin/medicos', titulo: 'Médicos', texto: 'Alta, especialidad y duración de cita', icon: <MedicalServicesRounded /> },
  { to: '/admin/usuarios', titulo: 'Usuarios', texto: 'Cuentas, roles y personal de admisión', icon: <GroupRounded /> },
  { to: '/admin/reportes', titulo: 'Reportes', texto: 'Citas filtradas y exportación CSV', icon: <AssessmentRounded /> },
];

export default function Panel() {
  const theme = useTheme();
  const modo = theme.palette.mode;
  const [desde, setDesde] = useState(() => rango('mes')[0]);
  const [hasta, setHasta] = useState(() => rango('mes')[1]);

  const filtro = qs({ desde: desde && aUtc(desde, '00:00'), hasta: hasta && aUtc(hasta, '23:59') });
  const resumen = useQuery({ queryKey: ['reportes', 'resumen', filtro], queryFn: () => get<Resumen>(`/api/reportes/resumen${filtro}`) });

  const desdeHoy = aUtc(hoyMas(), '00:00');
  const proximasQ = useQuery({
    queryKey: ['reportes', 'citas', 'proximas', desdeHoy],
    queryFn: () => get<FilaReporte[]>(`/api/reportes/citas${qs({ desde: desdeHoy })}`),
  });
  const proximas = { ...proximasQ, data: proximasQ.data?.filter(c => esFutura(c.fecha_hora) && (c.estado === 'agendada' || c.estado === 'en espera')).slice(0, 8) };

  const aplicar = (p: Preset) => { const [d, h] = rango(p); setDesde(d); setHasta(h); };
  const activo = PRESETS.find(p => { const [d, h] = rango(p.id); return d === desde && h === hasta; })?.id;

  return (
    <Box>
      <Encabezado antetitulo="Administración" titulo="Panel" subtitulo="Resumen de citas del periodo seleccionado." />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap role="group" aria-label="Rangos rápidos">
              {PRESETS.map(p => (
                <Chip key={p.id} label={p.label} onClick={() => aplicar(p.id)} color={activo === p.id ? 'primary' : 'default'}
                  variant={activo === p.id ? 'filled' : 'outlined'} />
              ))}
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ flex: 1, maxWidth: { md: 380 }, ml: { md: 'auto !important' } }}>
              <TextField type="date" label="Desde" value={desde} onChange={e => setDesde(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ colorScheme: modo }} />
              <TextField type="date" label="Hasta" value={hasta} onChange={e => setHasta(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ colorScheme: modo }} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Consulta q={resumen} filas={2}>
        {r => {
          const kpis: { label: string; valor: number; color: string }[] = [
            { label: 'Total', valor: r.total, color: theme.palette.primary.main },
            ...([['Agendadas', 'agendada', r.agendadas], ['En espera', 'en espera', r.enEspera], ['Atendidas', 'atendida', r.atendidas], ['Canceladas', 'cancelada', r.canceladas]] as [string, EstadoCita, number][])
              .map(([label, e, valor]) => ({ label, valor, color: estadoColores[modo][e].dot })),
          ];
          const esp = Object.entries(r.porEspecialidad).sort((a, b) => b[1] - a[1]);
          const max = Math.max(1, ...esp.map(e => e[1]));
          return (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
                {kpis.map(k => (
                  <Card key={k.label} sx={{ borderTop: 3, borderTopColor: k.color }}>
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: k.color }} />
                        <Typography variant="overline" color="text.secondary">{k.label}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 32, fontWeight: 600, lineHeight: '40px', mt: 1, fontVariantNumeric: 'tabular-nums' }}>
                        {k.valor.toLocaleString('es-CO')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">citas</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3, alignItems: 'start' }}>
                <Card>
                  <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Typography variant="h3">Citas por especialidad</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Todas las citas del periodo, en cualquier estado.</Typography>
                    {esp.length === 0 ? <Vacio titulo="Sin citas en este periodo" texto="Prueba con otro rango de fechas." /> : (
                      <Stack spacing={2} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                        {esp.map(([nombre, n]) => (
                          <Box component="li" key={nombre} aria-label={`${nombre}: ${n} citas`}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                              <Typography variant="body2" fontWeight={500}>{nombre}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{n} {n === 1 ? 'cita' : 'citas'}</Typography>
                            </Stack>
                            <Box sx={{ height: 10, borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
                              <Box sx={{ height: '100%', width: `${(n / max) * 100}%`, bgcolor: 'primary.main', borderRadius: 999 }} />
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h3">Próximas citas</Typography>
                      <Button component={RouterLink} to="/admision" size="small" endIcon={<ArrowForwardRounded />}>Ver agenda</Button>
                    </Stack>
                    <Consulta q={proximas} vacio={<Vacio titulo="No hay citas próximas" />}>
                      {lista => (
                        <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
                          {lista.map(c => (
                            <Stack key={c.id} direction="row" spacing={2} alignItems="center" sx={{ py: 1.25 }}>
                              <Box sx={{ width: 104, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                                <Typography variant="body2" fontWeight={600}>{hora(c.fecha_hora)}</Typography>
                                <Typography variant="caption" color="text.secondary">{fechaCorta(c.fecha_hora)}</Typography>
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={500} noWrap>{c.paciente_nombre}</Typography>
                                <Typography variant="caption" color="text.secondary" noWrap component="div">{c.medico_nombre} · {c.especialidad}</Typography>
                              </Box>
                              <EstadoChip estado={c.estado} />
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </Consulta>
                  </CardContent>
                </Card>
              </Box>
            </>
          );
        }}
      </Consulta>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mt: 3 }}>
        {ACCESOS.map(a => (
          <Card key={a.to}>
            <Box component={RouterLink} to={a.to} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2.5, color: 'inherit', textDecoration: 'none', '&:hover': { bgcolor: 'action.hover' } }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>{a.icon}</Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4">{a.titulo}</Typography>
                <Typography variant="body2" color="text.secondary">{a.texto}</Typography>
              </Box>
              <ArrowForwardRounded color="action" />
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
