import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardContent, Stack, Tab, Tabs, Typography } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import { TZ, diaMes, fechaLarga, hora } from '../../lib/fechas';
import type { Cita } from '../../lib/types';
import { Encabezado } from '../../components/Encabezado';
import { Consulta, Vacio } from '../../components/Estados';
import { EstadoChip } from '../../components/EstadoChip';
import { Iniciales } from '../../components/Iniciales';
import { AccionesCita } from '../../components/paciente/AccionesCita';
import { esProxima, proximas, useMisCitas } from '../../components/paciente/misCitas';

const mes = (iso: string) => new Intl.DateTimeFormat('es-CO', { timeZone: TZ, month: 'short' }).format(new Date(iso));

function ItemCita({ cita, acciones }: { cita: Cita; acciones: boolean }) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ width: 56, flexShrink: 0, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2, py: 1 }}>
              <Typography variant="caption" color="primary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>{mes(cita.fecha_hora)}</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: 20, lineHeight: 1.1 }}>{diaMes(cita.fecha_hora)}</Typography>
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ '&::first-letter': { textTransform: 'uppercase' } }}>
                {fechaLarga(cita.fecha_hora)} · {hora(cita.fecha_hora)}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Iniciales nombre={cita.nombre_medico} size={28} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" noWrap>{cita.nombre_medico}</Typography>
                </Box>
              </Stack>
              <Typography variant="body2" color="text.secondary">{cita.especialidad} · {cita.duracion_cita} min</Typography>
            </Box>
            <Box sx={{ alignSelf: 'flex-start' }}><EstadoChip estado={cita.estado} /></Box>
          </Stack>
          {acciones && <AccionesCita cita={cita} compacto />}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function MisCitas() {
  const [tab, setTab] = useState(0);
  const q = useMisCitas();
  const agendar = <Button variant="contained" component={RouterLink} to="/paciente/agendar" startIcon={<AddRounded />}>Agendar cita</Button>;

  return (
    <>
      <Encabezado antetitulo="Mis citas" titulo="Mis citas" subtitulo="Consulta, reprograma o cancela tus citas." acciones={agendar} />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Próximas" />
        <Tab label="Historial" />
      </Tabs>
      <Consulta q={q}>
        {data => {
          // Historial: más recientes primero (orden del API).
          const lista = tab === 0 ? proximas(data) : data.filter(c => !esProxima(c));
          if (lista.length === 0) {
            return tab === 0
              ? <Card><Vacio titulo="No tienes citas próximas" texto="Agenda una cita con el médico que prefieras." accion={agendar} /></Card>
              : <Card><Vacio titulo="Aún no hay historial" texto="Aquí verás tus citas pasadas, atendidas y canceladas." /></Card>;
          }
          return (
            <Stack spacing={1.5}>
              {lista.map(c => <ItemCita key={c.id} cita={c} acciones={tab === 0 && c.estado === 'agendada'} />)}
            </Stack>
          );
        }}
      </Consulta>
    </>
  );
}
