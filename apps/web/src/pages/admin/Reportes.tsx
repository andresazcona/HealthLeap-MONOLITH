import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import { Encabezado } from '../../components/Encabezado';
import { EstadoChip } from '../../components/EstadoChip';
import { Consulta, Vacio } from '../../components/Estados';
import { descargar, get, qs } from '../../lib/api';
import { aUtc, fechaCorta, hora } from '../../lib/fechas';
import { mensaje, useNotificar } from '../../lib/notificar';
import type { EstadoCita, FilaReporte, Medico } from '../../lib/types';

const ESTADOS: { v: EstadoCita; label: string }[] = [
  { v: 'agendada', label: 'Agendada' },
  { v: 'en espera', label: 'En espera' },
  { v: 'atendida', label: 'Atendida' },
  { v: 'cancelada', label: 'Cancelada' },
];

const inicial = () => ({ desde: '', hasta: '', estado: '', medico: '' });

export default function Reportes() {
  const notificar = useNotificar();
  const theme = useTheme();
  const modo = theme.palette.mode;
  const movil = useMediaQuery(theme.breakpoints.down('md'));
  const [f, setF] = useState(inicial);
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(25);
  const [bajando, setBajando] = useState(false);
  const set = (k: keyof ReturnType<typeof inicial>) => (v: string) => { setF(p => ({ ...p, [k]: v })); setPagina(0); };

  const medicos = useQuery({ queryKey: ['medicos', 'admin'], queryFn: () => get<Medico[]>('/api/medicos?limit=100') });
  const filtro = qs({
    desde: f.desde && aUtc(f.desde, '00:00'),
    hasta: f.hasta && aUtc(f.hasta, '23:59'),
    estado: f.estado,
    medico_id: f.medico,
  });
  const q = useQuery({ queryKey: ['reportes', 'citas', filtro], queryFn: () => get<FilaReporte[]>(`/api/reportes/citas${filtro}`) });

  const exportar = async () => {
    setBajando(true);
    try {
      await descargar(`/api/reportes/citas/csv${filtro}`, 'reporte-citas.csv');
      notificar('Reporte descargado');
    } catch (e) {
      notificar(mensaje(e), 'error');
    } finally {
      setBajando(false);
    }
  };

  const fecha = (k: 'desde' | 'hasta', label: string) => (
    <TextField type="date" label={label} value={f[k]} onChange={e => set(k)(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ colorScheme: modo }} />
  );

  return (
    <Box>
      <Encabezado
        antetitulo="Administración"
        titulo="Reportes"
        subtitulo="Consulta las citas por fecha, estado y médico, y expórtalas a CSV."
        acciones={
          <Button variant="contained" startIcon={<DownloadRounded />} onClick={exportar} disabled={bajando || !q.data?.length}>
            {bajando ? 'Descargando…' : 'Exportar CSV'}
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1.4fr auto' }, gap: 2, alignItems: 'center' }}>
            {fecha('desde', 'Desde')}
            {fecha('hasta', 'Hasta')}
            <TextField select label="Estado" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} value={f.estado} onChange={e => set('estado')(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS.map(e => <MenuItem key={e.v} value={e.v}>{e.label}</MenuItem>)}
            </TextField>
            <TextField select label="Médico" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} value={f.medico} onChange={e => set('medico')(e.target.value)} disabled={medicos.isLoading}>
              <MenuItem value="">Todos</MenuItem>
              {(medicos.data ?? []).map(m => <MenuItem key={m.id} value={m.id}>{m.nombre} · {m.especialidad}</MenuItem>)}
            </TextField>
            <Button variant="text" startIcon={<RestartAltRounded />} onClick={() => { setF(inicial()); setPagina(0); }}>Restablecer</Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h3">Citas</Typography>
          {q.data && (
            <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }} aria-live="polite">
              {q.data.length.toLocaleString('es-CO')} {q.data.length === 1 ? 'registro' : 'registros'}
            </Typography>
          )}
        </Stack>
        <Box sx={{ p: q.isLoading || q.error ? 2 : 0 }}>
          <Consulta q={q} filas={5} vacio={<Vacio titulo="Sin citas para estos filtros" texto="Ajusta las fechas, el estado o el médico." />}>
            {filas => {
              const visibles = filas.slice(pagina * porPagina, pagina * porPagina + porPagina);
              return (
                <>
                  {movil ? (
                    <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
                      {visibles.map(c => (
                        <Box key={c.id} sx={{ px: 2.5, py: 1.75 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>{fechaCorta(c.fecha_hora)} · {hora(c.fecha_hora)}</Typography>
                            <EstadoChip estado={c.estado} />
                          </Stack>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{c.paciente_nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.medico_nombre} · {c.especialidad}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Fecha y hora</TableCell>
                            <TableCell>Paciente</TableCell>
                            <TableCell>Correo</TableCell>
                            <TableCell>Médico</TableCell>
                            <TableCell>Especialidad</TableCell>
                            <TableCell>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {visibles.map(c => (
                            <TableRow key={c.id} hover>
                              <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                <Typography variant="body2" fontWeight={500}>{fechaCorta(c.fecha_hora)}</Typography>
                                <Typography variant="caption" color="text.secondary">{hora(c.fecha_hora)}</Typography>
                              </TableCell>
                              <TableCell>{c.paciente_nombre}</TableCell>
                              <TableCell><Typography variant="body2" color="text.secondary">{c.paciente_email}</Typography></TableCell>
                              <TableCell>{c.medico_nombre}</TableCell>
                              <TableCell>{c.especialidad}</TableCell>
                              <TableCell><EstadoChip estado={c.estado} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  <TablePagination
                    component="div"
                    count={filas.length}
                    page={Math.min(pagina, Math.max(0, Math.ceil(filas.length / porPagina) - 1))}
                    onPageChange={(_, p) => setPagina(p)}
                    rowsPerPage={porPagina}
                    onRowsPerPageChange={e => { setPorPagina(Number(e.target.value)); setPagina(0); }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage="Filas por página"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                    getItemAriaLabel={t => (t === 'next' ? 'Página siguiente' : t === 'previous' ? 'Página anterior' : t === 'first' ? 'Primera página' : 'Última página')}
                    sx={{ borderTop: 1, borderColor: 'divider', fontVariantNumeric: 'tabular-nums' }}
                  />
                </>
              );
            }}
          </Consulta>
        </Box>
      </Card>
    </Box>
  );
}
