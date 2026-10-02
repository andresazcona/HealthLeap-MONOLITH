import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import { get, post } from '../../lib/api';
import { aUtc, fechaLarga, hora, hoyMas, mediodia } from '../../lib/fechas';
import { mensaje, useNotificar } from '../../lib/notificar';
import type { Bloque, Disponibilidad, Medico } from '../../lib/types';
import { Encabezado } from '../../components/Encabezado';
import { Consulta } from '../../components/Estados';
import { NavFecha } from '../../components/staff/Comun';
import { LeyendaFranjas, MatrizFranjas } from '../../components/staff/MatrizFranjas';
import { FILAS, JORNADA, capital, hhmm } from '../../components/staff/util';

const PRESETS = [
  { etiqueta: 'Almuerzo 12:00–13:00', ini: 12 * 60, fin: 13 * 60 },
  { etiqueta: 'Mañana 08:00–12:00', ini: 8 * 60, fin: 12 * 60 },
  { etiqueta: 'Tarde 13:00–17:00', ini: 13 * 60, fin: 17 * 60 },
];

export default function Bloqueos() {
  const hoy = hoyMas(0);
  const [fecha, setFecha] = useState(hoy);
  const [ini, setIni] = useState(12 * 60);
  const [fin, setFin] = useState(13 * 60);
  const qc = useQueryClient();
  const notificar = useNotificar();

  const perfil = useQuery({ queryKey: ['medicos', 'perfil'], queryFn: () => get<Medico>('/api/medicos/perfil') });
  const id = perfil.data?.id;
  const q = useQuery({
    queryKey: ['disponibilidad', id, fecha],
    queryFn: () => get<Disponibilidad>(`/api/disponibilidad/medico/${id}/fecha/${fecha}`),
    enabled: Boolean(id),
  });

  // El endpoint REEMPLAZA todos los bloqueos del día: siempre se envía la lista completa.
  const guardar = useMutation({
    mutationFn: (bloques: Bloque[]) => post('/api/disponibilidad/bloquear', { fecha, bloques_bloqueados: bloques }),
    onSuccess: () => {
      notificar('Bloqueos guardados');
      qc.invalidateQueries({ queryKey: ['disponibilidad'] });
      qc.invalidateQueries({ queryKey: ['citas'] });
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const actuales = q.data?.bloquesBloqueados ?? [];
  const agregar = (a: number, b: number) => {
    const nuevo = { inicio: aUtc(fecha, hhmm(a)), fin: aUtc(fecha, hhmm(b)) };
    if (actuales.some(x => x.inicio < nuevo.fin && x.fin > nuevo.inicio)) {
      notificar('Ese horario se cruza con un bloqueo existente', 'warning');
      return;
    }
    guardar.mutate([...actuales, nuevo].sort((x, y) => x.inicio.localeCompare(y.inicio)));
  };
  const etiqueta = (m: number) => hora(aUtc(fecha, hhmm(m)));

  return (
    <>
      <Encabezado
        antetitulo="Médico"
        titulo="Bloquear horarios"
        subtitulo="Los pacientes no podrán agendar en los horarios que bloquees."
        acciones={<NavFecha fecha={fecha} onFecha={setFecha} min={hoy} />}
      />

      <Consulta
        q={{ isLoading: perfil.isLoading || q.isLoading, error: perfil.error || q.error, data: q.data, refetch: () => (perfil.error ? perfil.refetch() : q.refetch()) }}
        filas={4}
      >
        {d => (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '5fr 4fr' }, gap: 3, alignItems: 'start' }}>
            <Stack spacing={3}>
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h3" component="h2">Nuevo bloqueo</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>{capital(fechaLarga(mediodia(fecha)))}</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                    <TextField select label="Hora inicio" value={ini} onChange={e => {
                      const v = Number(e.target.value);
                      setIni(v);
                      if (fin <= v) setFin(v + JORNADA.paso);
                    }}>
                      {FILAS.map(m => <MenuItem key={m} value={m}>{etiqueta(m)}</MenuItem>)}
                    </TextField>
                    <TextField select label="Hora fin" value={fin} onChange={e => setFin(Number(e.target.value))}>
                      {[...FILAS, JORNADA.fin].filter(m => m > ini).map(m => <MenuItem key={m} value={m}>{etiqueta(m)}</MenuItem>)}
                    </TextField>
                    <Button variant="contained" startIcon={<AddRounded />} onClick={() => agregar(ini, fin)} disabled={guardar.isPending} sx={{ flexShrink: 0 }}>
                      {guardar.isPending ? 'Guardando…' : 'Bloquear'}
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>Atajos</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {PRESETS.map(p => (
                      <Chip key={p.etiqueta} label={p.etiqueta} variant="outlined" onClick={() => agregar(p.ini, p.fin)} disabled={guardar.isPending} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h4" component="h2" sx={{ mb: 1 }}>Bloqueos del día</Typography>
                  {d.bloquesBloqueados.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No hay horarios bloqueados este día.</Typography>
                  ) : (
                    <List disablePadding>
                      {d.bloquesBloqueados.map((b, i) => {
                        return (
                          <ListItem
                            key={b.inicio}
                            disableGutters
                            secondaryAction={
                              <Tooltip title="Quitar bloqueo">
                                <span>
                                  <IconButton
                                    edge="end"
                                    aria-label={`Quitar bloqueo ${hora(b.inicio)} a ${hora(b.fin)}`}
                                    disabled={guardar.isPending}
                                    onClick={() => guardar.mutate(d.bloquesBloqueados.filter((_, j) => j !== i))}
                                  >
                                    <DeleteOutlineRounded />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            }
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}><LockRounded fontSize="small" /></ListItemIcon>
                            <ListItemText primary={`${hora(b.inicio)} – ${hora(b.fin)}`} />
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h4" component="h2" sx={{ mb: 1 }}>Citas del día</Typography>
                  {d.citasAgendadas.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No hay citas agendadas este día.</Typography>
                  ) : (
                    <List disablePadding>
                      {d.citasAgendadas.map(c => (
                        <ListItem key={c.id} disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}><EventRounded fontSize="small" color="primary" /></ListItemIcon>
                          <ListItemText primary={c.paciente} secondary={`${hora(c.inicio)} – ${hora(c.fin)}`} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
                    No se puede bloquear un horario que ya tiene una cita.
                  </Typography>
                </CardContent>
              </Card>
            </Stack>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" component="h2" sx={{ mb: 1 }}>Vista del día</Typography>
              <LeyendaFranjas />
              <MatrizFranjas fecha={fecha} columnas={[{ id: d.medico_id, titulo: perfil.data?.nombre ?? 'Mi agenda', subtitulo: perfil.data && `Citas de ${perfil.data.duracion_cita} min`, disp: d }]} />
            </Box>
          </Box>
        )}
      </Consulta>
    </>
  );
}
