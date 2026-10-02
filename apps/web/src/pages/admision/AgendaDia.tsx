import { useState } from 'react';
import {
  Button, Card, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import HowToRegRounded from '@mui/icons-material/HowToRegRounded';
import { get, patch, qs } from '../../lib/api';
import { fechaLarga, hora, hoyMas, mediodia } from '../../lib/fechas';
import { mensaje, useNotificar } from '../../lib/notificar';
import type { Cita, EstadoCita } from '../../lib/types';
import { Encabezado } from '../../components/Encabezado';
import { EstadoChip } from '../../components/EstadoChip';
import { Consulta, Vacio } from '../../components/Estados';
import { Confirmar } from '../../components/Confirmar';
import { Contadores, NavFecha } from '../../components/staff/Comun';
import { capital } from '../../components/staff/util';

const ESTADOS: { valor: EstadoCita; etiqueta: string }[] = [
  { valor: 'agendada', etiqueta: 'Agendadas' },
  { valor: 'en espera', etiqueta: 'En espera' },
  { valor: 'atendida', etiqueta: 'Atendidas' },
  { valor: 'cancelada', etiqueta: 'Canceladas' },
];

export default function AgendaDia() {
  const [fecha, setFecha] = useState(hoyMas(0));
  const [medico, setMedico] = useState('');
  const [estado, setEstado] = useState('');
  const [cancelar, setCancelar] = useState<Cita | null>(null);
  const escritorio = useMediaQuery(useTheme().breakpoints.up('lg'));
  const qc = useQueryClient();
  const notificar = useNotificar();

  const q = useQuery({
    queryKey: ['citas', 'agenda-diaria', fecha],
    queryFn: () => get<Cita[]>(`/api/citas/agenda-diaria${qs({ fecha })}`),
    refetchInterval: 30_000,
  });

  const exito = (msg: string) => {
    notificar(msg);
    qc.invalidateQueries({ queryKey: ['citas'] });
    qc.invalidateQueries({ queryKey: ['disponibilidad'] });
  };
  const llegada = useMutation({
    mutationFn: (c: Cita) => patch(`/api/citas/${c.id}/en-espera`),
    onSuccess: (_, c) => exito(`${c.nombre_paciente} está en sala de espera`),
    onError: e => notificar(mensaje(e), 'error'),
  });
  const anular = useMutation({
    mutationFn: (c: Cita) => patch(`/api/citas/${c.id}/cancelar`),
    onSuccess: () => { setCancelar(null); exito('Cita cancelada'); },
    onError: e => notificar(mensaje(e), 'error'),
  });
  const ocupado = llegada.isPending || anular.isPending;

  const acciones = (c: Cita) => (
    <Stack direction="row" spacing={1} justifyContent={{ lg: 'flex-end' }} sx={{ '& .MuiButton-root': { whiteSpace: 'nowrap' } }}>
      {c.estado === 'agendada' && (
        <Button size="small" variant="contained" startIcon={<HowToRegRounded />} disabled={ocupado} onClick={() => llegada.mutate(c)}>
          {llegada.isPending && llegada.variables?.id === c.id ? 'Guardando…' : 'Marcar llegada'}
        </Button>
      )}
      {(c.estado === 'agendada' || c.estado === 'en espera') && (
        <Button size="small" variant="outlined" color="error" disabled={ocupado} onClick={() => setCancelar(c)}>Cancelar</Button>
      )}
    </Stack>
  );

  return (
    <>
      <Encabezado
        antetitulo="Admisión"
        titulo="Agenda del día"
        subtitulo={capital(fechaLarga(mediodia(fecha)))}
        acciones={<NavFecha fecha={fecha} onFecha={f => { setFecha(f); setMedico(''); }} />}
      />

      <Consulta q={q} filas={5}>
        {citas => {
          const cuenta = (e: EstadoCita) => citas.filter(c => c.estado === e).length;
          const medicos = [...new Map(citas.map(c => [c.medico_id, c.nombre_medico])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
          const filas = citas
            .filter(c => (!medico || c.medico_id === medico) && (!estado || c.estado === estado))
            .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));

          return (
            <>
              <Contadores items={[
                { etiqueta: 'Total', valor: citas.length },
                ...ESTADOS.map(e => ({ etiqueta: e.etiqueta, valor: cuenta(e.valor), estado: e.valor })),
              ]} />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                <TextField select label="Médico" value={medico} onChange={e => setMedico(e.target.value)} sx={{ maxWidth: { sm: 280 } }} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
                  <MenuItem value="">Todos los médicos ({medicos.length})</MenuItem>
                  {medicos.map(([id, nombre]) => <MenuItem key={id} value={id}>{nombre}</MenuItem>)}
                </TextField>
                <TextField select label="Estado" value={estado} onChange={e => setEstado(e.target.value)} sx={{ maxWidth: { sm: 220 } }} slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}>
                  <MenuItem value="">Todos los estados</MenuItem>
                  {ESTADOS.map(e => <MenuItem key={e.valor} value={e.valor}>{e.etiqueta} ({cuenta(e.valor)})</MenuItem>)}
                </TextField>
              </Stack>

              {filas.length === 0 ? (
                <Card>
                  <Vacio
                    titulo={citas.length ? 'Ninguna cita coincide con el filtro' : 'No hay citas este día'}
                    texto={citas.length ? 'Prueba con otro médico o estado.' : 'Las citas agendadas para esta fecha aparecerán aquí.'}
                  />
                </Card>
              ) : escritorio ? (
                <TableContainer component={Card}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Hora</TableCell>
                        <TableCell>Paciente</TableCell>
                        <TableCell>Médico y especialidad</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filas.map(c => (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{hora(c.fecha_hora)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{c.nombre_paciente}</Typography>
                            {c.email_paciente && <Typography variant="caption" color="text.secondary">{c.email_paciente}</Typography>}
                          </TableCell>
                          <TableCell><Typography variant="body2">{c.nombre_medico}</Typography><Typography variant="caption" color="text.secondary">{c.especialidad}</Typography></TableCell>
                          <TableCell><EstadoChip estado={c.estado} /></TableCell>
                          <TableCell align="right">{acciones(c)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Stack spacing={1.5}>
                  {filas.map(c => (
                    <Card key={c.id} sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography fontWeight={600}>{hora(c.fecha_hora)}</Typography>
                        <EstadoChip estado={c.estado} />
                      </Stack>
                      <Typography variant="h4">{c.nombre_paciente}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{c.nombre_medico} · {c.especialidad}</Typography>
                      {acciones(c)}
                    </Card>
                  ))}
                </Stack>
              )}
            </>
          );
        }}
      </Consulta>

      <Confirmar
        abierto={Boolean(cancelar)}
        titulo="Cancelar cita"
        texto={cancelar && <>¿Cancelar la cita de <b>{cancelar.nombre_paciente}</b> con {cancelar.nombre_medico} a las {hora(cancelar.fecha_hora)}? El horario quedará libre.</>}
        confirmar={anular.isPending ? 'Cancelando…' : 'Cancelar cita'}
        peligro
        cargando={anular.isPending}
        onConfirmar={() => cancelar && anular.mutate(cancelar)}
        onCerrar={() => setCancelar(null)}
      />
    </>
  );
}
