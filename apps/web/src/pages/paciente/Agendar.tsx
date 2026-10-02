import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Card, CardActionArea, CardContent, Chip, InputAdornment, Stack, Step, StepLabel, Stepper, TextField,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { get, post, qs } from '../../lib/api';
import { fechaLarga, hora, hoyMas } from '../../lib/fechas';
import { mensaje, useNotificar } from '../../lib/notificar';
import type { Medico } from '../../lib/types';
import { Encabezado } from '../../components/Encabezado';
import { Consulta, Vacio } from '../../components/Estados';
import { Iniciales } from '../../components/Iniciales';
import { SelectorHorario } from '../../components/SelectorHorario';

function Seccion({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <Box>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600 }}>{n}</Box>
        <Typography variant="h4" component="h2">{titulo}</Typography>
      </Stack>
      {children}
    </Box>
  );
}

function TarjetaMedico({ m, activo, onClick }: { m: Medico; activo: boolean; onClick: () => void }) {
  return (
    <Card sx={{ borderColor: activo ? 'primary.main' : undefined, borderWidth: activo ? 2 : 1 }}>
      <CardActionArea onClick={onClick} aria-pressed={activo} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Iniciales nombre={m.nombre} size={48} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" noWrap>{m.nombre}</Typography>
            <Typography variant="body2" color="primary" noWrap>{m.especialidad}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary" sx={{ mt: 0.5 }}>
              <ScheduleRounded sx={{ fontSize: 16 }} />
              <Typography variant="caption">Consultas de {m.duracion_cita} min</Typography>
            </Stack>
          </Box>
          {activo && <CheckCircleRounded color="primary" />}
        </Stack>
      </CardActionArea>
    </Card>
  );
}

export default function Agendar() {
  const movil = useMediaQuery(useTheme().breakpoints.down('md'));
  const navigate = useNavigate();
  const qc = useQueryClient();
  const notificar = useNotificar();
  const [params, setParams] = useSearchParams();
  const especialidad = params.get('especialidad') ?? '';
  const [texto, setTexto] = useState('');
  const [nombre, setNombre] = useState('');
  const [medico, setMedico] = useState<Medico | null>(null);
  const [fecha, setFecha] = useState(hoyMas(0));
  const [seleccion, setSeleccion] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setNombre(texto.trim()), 300);
    return () => clearTimeout(t);
  }, [texto]);

  const especialidades = useQuery({ queryKey: ['especialidades'], queryFn: () => get<string[]>('/api/medicos/especialidades') });
  const medicos = useQuery({
    queryKey: ['medicos', 'buscar', especialidad, nombre],
    queryFn: () => get<Medico[]>(`/api/medicos/buscar${qs({ especialidad, nombre, limit: 50 })}`),
  });

  const agendar = useMutation({
    mutationFn: () => post('/api/citas', { medico_id: medico!.id, fecha_hora: seleccion }),
    onSuccess: () => {
      notificar('Cita agendada');
      qc.invalidateQueries({ queryKey: ['citas'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad'] });
      navigate('/paciente/citas');
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const filtrar = (e: string) => {
    setParams(e && e !== especialidad ? { especialidad: e } : {}, { replace: true });
  };
  const elegir = (m: Medico) => { setMedico(m); setSeleccion(null); setFecha(hoyMas(0)); };
  const paso = !medico ? 0 : !seleccion ? 1 : 2;
  const confirmar = (
    <Button
      variant="contained"
      size="large"
      fullWidth
      startIcon={<EventAvailableRounded />}
      disabled={!medico || !seleccion || agendar.isPending}
      onClick={() => agendar.mutate()}
      sx={movil ? { borderRadius: 999, minHeight: 48 } : undefined}
    >
      {agendar.isPending ? 'Agendando…' : 'Confirmar cita'}
    </Button>
  );

  const lista = (
    <Stack spacing={2}>
      <TextField
        label="Buscar médico por nombre"
        value={texto}
        onChange={e => setTexto(e.target.value)}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> } }}
      />
      <Consulta q={especialidades} filas={1}>
        {esp => (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" role="group" aria-label="Filtrar por especialidad">
            <Chip label="Todas" color={!especialidad ? 'primary' : 'default'} variant={!especialidad ? 'filled' : 'outlined'} onClick={() => filtrar('')} />
            {esp.map(e => (
              <Chip key={e} label={e} color={e === especialidad ? 'primary' : 'default'} variant={e === especialidad ? 'filled' : 'outlined'} onClick={() => filtrar(e)} />
            ))}
          </Stack>
        )}
      </Consulta>
      <Consulta q={medicos} filas={3} vacio={<Card><Vacio titulo="No encontramos médicos" texto="Prueba con otro nombre o especialidad." /></Card>}>
        {ms => (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">{ms.length} {ms.length === 1 ? 'médico' : 'médicos'}</Typography>
            {ms.map(m => <TarjetaMedico key={m.id} m={m} activo={m.id === medico?.id} onClick={() => elegir(m)} />)}
          </Stack>
        )}
      </Consulta>
    </Stack>
  );

  const reserva = medico && (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          {movil && (
            <Button startIcon={<ArrowBackRounded />} onClick={() => setMedico(null)} sx={{ alignSelf: 'flex-start' }}>
              Cambiar médico
            </Button>
          )}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
            <Iniciales nombre={medico.nombre} size={52} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h3" noWrap>{medico.nombre}</Typography>
              <Typography variant="body2" color="primary">{medico.especialidad} · Consultas de {medico.duracion_cita} min</Typography>
            </Box>
          </Stack>
          <Seccion n={2} titulo="Elige fecha y hora">
            <SelectorHorario
              medicoId={medico.id}
              fecha={fecha}
              onFecha={f => { setFecha(f); setSeleccion(null); }}
              seleccion={seleccion}
              onSeleccion={setSeleccion}
            />
          </Seccion>
          <Seccion n={3} titulo="Confirma tu cita">
            {seleccion ? (
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                <Typography variant="overline" color="text.secondary">Fecha y hora</Typography>
                <Typography variant="h4" sx={{ '&::first-letter': { textTransform: 'uppercase' } }}>{fechaLarga(seleccion)}</Typography>
                <Typography color="text.secondary">{hora(seleccion)} (hora Colombia) · {medico.duracion_cita} min</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Podrás reprogramar o cancelar desde Mis citas. Llega 10 minutos antes.
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">Selecciona un horario libre para ver el resumen.</Typography>
            )}
            {!movil && <Box sx={{ mt: 2 }}>{confirmar}</Box>}
          </Seccion>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Encabezado antetitulo="Agendar" titulo="Agendar cita" subtitulo="Elige un médico y un horario libre." />
      <Stepper activeStep={paso} alternativeLabel={movil} sx={{ mb: 3 }}>
        {['Médico', 'Fecha y hora', 'Confirmación'].map(l => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
      </Stepper>

      {movil ? (
        <>
          {medico ? reserva : <Seccion n={1} titulo="Elige tu médico">{lista}</Seccion>}
          {medico && (
            <>
              <Box sx={{ height: 72 }} />
              <Box sx={{ position: 'fixed', left: 16, right: 16, bottom: 72, zIndex: 11 }}>{confirmar}</Box>
            </>
          )}
        </>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 3, alignItems: 'start', '& > *': { minWidth: 0 } }}>
          <Seccion n={1} titulo="Elige tu médico">{lista}</Seccion>
          <Box>
            {reserva ?? (
              <Card><Vacio titulo="Selecciona un médico" texto="Verás sus horarios libres de los próximos 14 días." /></Card>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}
