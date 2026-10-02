import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import AddRounded from '@mui/icons-material/AddRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import MedicalServicesRounded from '@mui/icons-material/MedicalServicesRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { get } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { fechaLarga, hora, diaMes, diaSemana } from '../../lib/fechas';
import type { Cita } from '../../lib/types';
import { Encabezado } from '../../components/Encabezado';
import { Consulta, Vacio } from '../../components/Estados';
import { EstadoChip } from '../../components/EstadoChip';
import { Iniciales } from '../../components/Iniciales';
import { AccionesCita } from '../../components/paciente/AccionesCita';
import { proximas, useMisCitas } from '../../components/paciente/misCitas';

function ProximaCita({ cita }: { cita: Cita }) {
  return (
    <Card sx={{ borderLeft: 4, borderLeftColor: 'primary.main' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <CalendarMonthRounded fontSize="small" />
            <Typography variant="overline">Tu próxima cita</Typography>
          </Stack>
          <EstadoChip estado={cita.estado} />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
          <Iniciales nombre={cita.nombre_medico} size={56} />
          <Box>
            <Typography variant="h3">{cita.nombre_medico}</Typography>
            <Typography color="text.secondary">{cita.especialidad}</Typography>
          </Box>
        </Stack>
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, mb: 2.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <ScheduleRounded color="primary" sx={{ mt: 0.25 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Fecha y hora</Typography>
              <Typography variant="h4" sx={{ '&::first-letter': { textTransform: 'uppercase' } }}>{fechaLarga(cita.fecha_hora)}</Typography>
              <Typography variant="body2" color="text.secondary">{hora(cita.fecha_hora)} (hora Colombia) · {cita.duracion_cita} min</Typography>
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: cita.estado === 'agendada' ? 2.5 : 0 }} color="text.secondary">
          <InfoOutlined fontSize="small" />
          <Typography variant="body2">Llega 10 minutos antes de tu hora.</Typography>
        </Stack>
        {cita.estado === 'agendada' && <AccionesCita cita={cita} />}
      </CardContent>
    </Card>
  );
}

function FilaCita({ cita }: { cita: Cita }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.5 }}>
      <Box sx={{ width: 52, textAlign: 'center', flexShrink: 0, bgcolor: 'action.hover', borderRadius: 2, py: 0.75 }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', display: 'block' }}>{diaSemana(cita.fecha_hora)}</Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 18, lineHeight: 1.1 }}>{diaMes(cita.fecha_hora)}</Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h4" noWrap>{cita.nombre_medico}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>{cita.especialidad} · {hora(cita.fecha_hora)}</Typography>
      </Box>
      <EstadoChip estado={cita.estado} />
    </Stack>
  );
}

export default function Inicio() {
  const { user } = useAuth();
  const citas = useMisCitas();
  const especialidades = useQuery({ queryKey: ['especialidades'], queryFn: () => get<string[]>('/api/medicos/especialidades') });
  const nombre = user?.nombre.split(/\s+/)[0] ?? '';

  return (
    <>
      <Encabezado
        antetitulo="Inicio"
        titulo={`Hola, ${nombre}`}
        subtitulo="Agenda y gestiona tus citas médicas."
        acciones={<Button variant="contained" component={RouterLink} to="/paciente/agendar" startIcon={<AddRounded />}>Agendar cita</Button>}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3, alignItems: 'start', '& > *': { minWidth: 0 } }}>
        <Stack spacing={3}>
          <Consulta q={citas}>
            {data => {
              const p = proximas(data)[0];
              return p ? <ProximaCita cita={p} /> : (
                <Card>
                  <Vacio
                    titulo="No tienes citas próximas"
                    texto="Elige un médico y un horario libre en pocos pasos."
                    accion={<Button variant="contained" component={RouterLink} to="/paciente/agendar" startIcon={<AddRounded />}>Agendar cita</Button>}
                  />
                </Card>
              );
            }}
          </Consulta>

          <Box>
            <Typography variant="h3" sx={{ mb: 1.5 }}>Especialidades</Typography>
            <Consulta q={especialidades} filas={2} vacio={<Typography color="text.secondary">Aún no hay especialidades disponibles.</Typography>}>
              {lista => (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                  {lista.map(e => (
                    <Card key={e}>
                      <CardActionArea component={RouterLink} to={`/paciente/agendar?especialidad=${encodeURIComponent(e)}`} sx={{ p: 2, height: '100%' }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'primary.main', mb: 1.5 }}>
                          <MedicalServicesRounded />
                        </Box>
                        <Typography variant="h4">{e}</Typography>
                        <Typography variant="caption" color="primary">Ver médicos</Typography>
                      </CardActionArea>
                    </Card>
                  ))}
                </Box>
              )}
            </Consulta>
          </Box>
        </Stack>

        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h3">Próximas citas</Typography>
              <Button size="small" component={RouterLink} to="/paciente/citas" endIcon={<ArrowForwardRounded />}>Ver todas</Button>
            </Stack>
            <Consulta q={citas}>
              {data => {
                const lista = proximas(data).slice(0, 3);
                return lista.length === 0
                  ? <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No tienes citas programadas.</Typography>
                  : <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>{lista.map(c => <FilaCita key={c.id} cita={c} />)}</Stack>;
              }}
            </Consulta>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
