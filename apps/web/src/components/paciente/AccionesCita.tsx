import { useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import EventRepeatRounded from '@mui/icons-material/EventRepeatRounded';
import EventBusyRounded from '@mui/icons-material/EventBusyRounded';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch, put } from '../../lib/api';
import { fechaLarga, hora, hoyMas } from '../../lib/fechas';
import { mensaje, useNotificar } from '../../lib/notificar';
import type { Cita } from '../../lib/types';
import { Confirmar } from '../Confirmar';
import { SelectorHorario } from '../SelectorHorario';

/** Botones Reprogramar y Cancelar de una cita del paciente, con sus diálogos. */
export function AccionesCita({ cita, compacto }: { cita: Cita; compacto?: boolean }) {
  const qc = useQueryClient();
  const notificar = useNotificar();
  const movil = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [reprogramar, setReprogramar] = useState(false);
  const [cancelar, setCancelar] = useState(false);
  const [fecha, setFecha] = useState(hoyMas(0));
  const [seleccion, setSeleccion] = useState<string | null>(null);

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['citas'] });
    qc.invalidateQueries({ queryKey: ['disponibilidad'] });
  };

  const mover = useMutation({
    mutationFn: (fecha_hora: string) => put(`/api/citas/${cita.id}`, { fecha_hora }),
    onSuccess: () => { notificar('Cita reprogramada'); setReprogramar(false); refrescar(); },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const anular = useMutation({
    mutationFn: () => patch(`/api/citas/${cita.id}/cancelar`),
    onSuccess: () => { notificar('Cita cancelada'); setCancelar(false); refrescar(); },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const abrirReprogramar = () => { setFecha(hoyMas(0)); setSeleccion(null); setReprogramar(true); };
  const size = compacto ? 'small' : 'medium';

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button size={size} variant="outlined" startIcon={<EventRepeatRounded />} onClick={abrirReprogramar}>
          Reprogramar
        </Button>
        <Button size={size} color="error" startIcon={<EventBusyRounded />} onClick={() => setCancelar(true)}>
          Cancelar
        </Button>
      </Stack>

      <Dialog open={reprogramar} onClose={() => setReprogramar(false)} maxWidth="sm" fullWidth fullScreen={movil}>
        <DialogTitle sx={{ fontWeight: 600 }}>Reprogramar cita</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {cita.nombre_medico} · {cita.especialidad}. Actual: {fechaLarga(cita.fecha_hora)}, {hora(cita.fecha_hora)}
          </Typography>
          <SelectorHorario
            medicoId={cita.medico_id}
            fecha={fecha}
            onFecha={f => { setFecha(f); setSeleccion(null); }}
            seleccion={seleccion}
            onSeleccion={setSeleccion}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setReprogramar(false)}>Volver</Button>
          <Button variant="contained" disabled={!seleccion || mover.isPending} onClick={() => seleccion && mover.mutate(seleccion)}>
            {mover.isPending ? 'Guardando…' : seleccion ? `Mover a las ${hora(seleccion)}` : 'Elige un horario'}
          </Button>
        </DialogActions>
      </Dialog>

      <Confirmar
        abierto={cancelar}
        titulo="¿Cancelar esta cita?"
        texto={<>Se liberará tu horario con {cita.nombre_medico} el {fechaLarga(cita.fecha_hora)} a las {hora(cita.fecha_hora)}.</>}
        confirmar={anular.isPending ? 'Cancelando…' : 'Sí, cancelar'}
        peligro
        cargando={anular.isPending}
        onConfirmar={() => anular.mutate()}
        onCerrar={() => setCancelar(false)}
      />
    </>
  );
}
