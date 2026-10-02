import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip,
  Typography, Autocomplete, useMediaQuery, useTheme,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { Encabezado } from '../../components/Encabezado';
import { Consulta, Vacio } from '../../components/Estados';
import { Confirmar } from '../../components/Confirmar';
import { Iniciales } from '../../components/Iniciales';
import { del, get, patch, post } from '../../lib/api';
import { mensaje, useNotificar } from '../../lib/notificar';
import type { Medico } from '../../lib/types';

const DURACIONES = [10, 15, 20, 30, 40, 45, 60, 90, 120];
// No hay endpoint de centros: todos los médicos existentes usan este centro.
const CENTRO_POR_DEFECTO = 'c0000000-0000-4000-8000-000000000001';

type Form = { nombre: string; email: string; password: string; especialidad: string; duracion: number; centro: string };

function DialogoMedico({ medico, centroSugerido, onCerrar }: { medico: Medico | null | undefined; centroSugerido: string; onCerrar: () => void }) {
  // medico === null → nuevo; Medico → editar; undefined → cerrado
  const nuevo = medico === null;
  const qc = useQueryClient();
  const notificar = useNotificar();
  const especialidades = useQuery({ queryKey: ['especialidades'], queryFn: () => get<string[]>('/api/medicos/especialidades') });
  const [f, setF] = useState<Form>(() => ({
    nombre: '', email: '', password: '',
    especialidad: medico?.especialidad ?? '', duracion: medico?.duracion_cita ?? 30, centro: medico?.centro_id ?? centroSugerido,
  }));
  const set = (k: keyof Form) => (v: string | number) => setF(p => ({ ...p, [k]: v }));

  const guardar = useMutation({
    mutationFn: () => nuevo
      ? post('/api/medicos/completo', {
        usuario: { nombre: f.nombre.trim(), email: f.email.trim(), password: f.password },
        especialidad: f.especialidad.trim(), centro_id: f.centro.trim(), duracion_cita: f.duracion,
      })
      : patch(`/api/medicos/${medico!.id}`, { especialidad: f.especialidad.trim(), duracion_cita: f.duracion }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicos'] });
      qc.invalidateQueries({ queryKey: ['especialidades'] });
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      notificar(nuevo ? 'Médico creado' : 'Cambios guardados');
      onCerrar();
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const valido = f.especialidad.trim().length > 0 && (!nuevo || (f.nombre.trim().length >= 3 && /\S+@\S+\.\S+/.test(f.email) && f.password.length >= 8 && f.centro.trim()));
  const enviar = (e: FormEvent) => { e.preventDefault(); if (valido) guardar.mutate(); };

  return (
    <Dialog open onClose={onCerrar} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={enviar} noValidate sx={{ display: 'contents' }}>
      <DialogTitle sx={{ fontWeight: 600 }}>{nuevo ? 'Nuevo médico' : `Editar a ${medico!.nombre}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {nuevo && (
            <>
              <TextField label="Nombre completo" value={f.nombre} onChange={e => set('nombre')(e.target.value)} required autoFocus helperText="Ej.: Dra. Ana Ruiz" />
              <TextField label="Correo electrónico" type="email" value={f.email} onChange={e => set('email')(e.target.value)} required autoComplete="off" />
              <TextField label="Contraseña temporal" type="text" value={f.password} onChange={e => set('password')(e.target.value)} required
                autoComplete="new-password" helperText="Mínimo 8 caracteres. Compártela con el médico para su primer ingreso."
                error={f.password.length > 0 && f.password.length < 8} />
            </>
          )}
          <Autocomplete
            freeSolo
            options={especialidades.data ?? []}
            inputValue={f.especialidad}
            onInputChange={(_, v) => set('especialidad')(v)}
            renderInput={p => <TextField {...p} label="Especialidad" required helperText="Elige una existente o escribe una nueva" />}
          />
          <TextField select label="Duración de la cita" value={f.duracion} onChange={e => set('duracion')(Number(e.target.value))}>
            {DURACIONES.map(d => <MenuItem key={d} value={d}>{d} minutos</MenuItem>)}
          </TextField>
          {nuevo && (
            <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreRounded />}><Typography variant="body2" fontWeight={500}>Avanzado</Typography></AccordionSummary>
              <AccordionDetails>
                <TextField label="ID de centro (UUID)" value={f.centro} onChange={e => set('centro')(e.target.value)} required
                  helperText="Identificador interno del centro. Déjalo como está salvo que sepas que debe cambiar." slotProps={{ htmlInput: { spellCheck: false } }} />
              </AccordionDetails>
            </Accordion>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={!valido || guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : nuevo ? 'Crear médico' : 'Guardar'}
        </Button>
      </DialogActions>
      </Box>
    </Dialog>
  );
}

export default function Medicos() {
  const qc = useQueryClient();
  const notificar = useNotificar();
  const movil = useMediaQuery(useTheme().breakpoints.down('md'));
  const [buscar, setBuscar] = useState('');
  const [editando, setEditando] = useState<Medico | null | undefined>(undefined);
  const [borrando, setBorrando] = useState<Medico | null>(null);

  const q = useQuery({ queryKey: ['medicos', 'admin'], queryFn: () => get<Medico[]>('/api/medicos?limit=100') });
  const eliminar = useMutation({
    mutationFn: (m: Medico) => del(`/api/medicos/${m.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicos'] });
      qc.invalidateQueries({ queryKey: ['especialidades'] });
      notificar('Médico eliminado');
      setBorrando(null);
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const t = buscar.trim().toLowerCase();
  const filtrados = (q.data ?? []).filter(m => !t || [m.nombre, m.email, m.especialidad].some(v => v.toLowerCase().includes(t)));
  const centroSugerido = q.data?.[0]?.centro_id ?? CENTRO_POR_DEFECTO;

  const acciones = (m: Medico) => (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
      <Tooltip title="Editar"><IconButton aria-label={`Editar a ${m.nombre}`} onClick={() => setEditando(m)}><EditRounded fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Eliminar"><IconButton aria-label={`Eliminar a ${m.nombre}`} onClick={() => setBorrando(m)} color="error"><DeleteRounded fontSize="small" /></IconButton></Tooltip>
    </Stack>
  );

  return (
    <Box>
      <Encabezado
        antetitulo="Administración"
        titulo="Médicos"
        subtitulo={q.data ? `${q.data.length} ${q.data.length === 1 ? 'médico registrado' : 'médicos registrados'}` : 'Directorio de médicos'}
        acciones={<Button variant="contained" startIcon={<AddRounded />} onClick={() => setEditando(null)}>Nuevo médico</Button>}
      />

      <Card>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            placeholder="Buscar por nombre, correo o especialidad"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            sx={{ maxWidth: 420 }}
            slotProps={{ htmlInput: { 'aria-label': 'Buscar médicos' }, input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }}
          />
        </Box>
        <Box sx={{ p: q.isLoading || q.error ? 2 : 0 }}>
          <Consulta q={{ ...q, data: q.data && filtrados }} vacio={
            <Vacio titulo={t ? 'Sin resultados' : 'Aún no hay médicos'} texto={t ? 'Prueba con otro término de búsqueda.' : 'Crea el primero con “Nuevo médico”.'} />
          }>
            {lista => movil ? (
              <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
                {lista.map(m => (
                  <CardContent key={m.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Iniciales nombre={m.nombre} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>{m.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{m.email}</Typography>
                      <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{m.especialidad} · {m.duracion_cita} min</Typography>
                    </Box>
                    {acciones(m)}
                  </CardContent>
                ))}
              </Stack>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Médico</TableCell>
                      <TableCell>Correo</TableCell>
                      <TableCell>Especialidad</TableCell>
                      <TableCell align="right">Duración de cita</TableCell>
                      <TableCell align="right"><Box component="span" sx={visuallyHidden}>Acciones</Box></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lista.map(m => (
                      <TableRow key={m.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Iniciales nombre={m.nombre} size={36} />
                            <Typography variant="body2" fontWeight={600}>{m.nombre}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{m.email}</Typography></TableCell>
                        <TableCell>{m.especialidad}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{m.duracion_cita} min</TableCell>
                        <TableCell align="right">{acciones(m)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Consulta>
        </Box>
      </Card>

      {editando !== undefined && <DialogoMedico key={editando?.id ?? 'nuevo'} medico={editando} centroSugerido={centroSugerido} onCerrar={() => setEditando(undefined)} />}

      <Confirmar
        abierto={Boolean(borrando)}
        titulo="Eliminar médico"
        texto={<>Se eliminará el perfil de <b>{borrando?.nombre}</b>. Si tiene citas registradas, el sistema no permitirá eliminarlo. Su cuenta de usuario se conserva y puedes eliminarla en Usuarios.</>}
        confirmar={eliminar.isPending ? 'Eliminando…' : 'Eliminar'}
        peligro
        cargando={eliminar.isPending}
        onConfirmar={() => borrando && eliminar.mutate(borrando)}
        onCerrar={() => setBorrando(null)}
      />
    </Box>
  );
}

const visuallyHidden = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;
