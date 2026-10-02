import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '../lib/api';
import { nombreRol, useAuth } from '../lib/auth';
import { mensaje, useNotificar } from '../lib/notificar';
import type { Medico } from '../lib/types';
import { Encabezado } from '../components/Encabezado';
import { Consulta } from '../components/Estados';
import { Iniciales } from '../components/Iniciales';

function Bloque({ titulo, texto, children }: { titulo: string; texto?: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography variant="h3" component="h2">{titulo}</Typography>
        {texto && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{texto}</Typography>}
        <Box sx={{ mt: 2.5 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

function DatosPersonales() {
  const { user, refrescar } = useAuth();
  const notificar = useNotificar();
  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const guardar = useMutation({
    mutationFn: () => patch('/api/usuarios/me', { nombre: nombre.trim(), email: email.trim() }),
    onSuccess: async () => { await refrescar(); notificar('Datos actualizados'); },
    onError: e => notificar(mensaje(e), 'error'),
  });
  const sinCambios = nombre.trim() === user?.nombre && email.trim() === user?.email;

  return (
    <Bloque titulo="Datos personales">
      <Stack component="form" spacing={2.5} noValidate onSubmit={(e: FormEvent) => { e.preventDefault(); guardar.mutate(); }}>
        <TextField label="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required autoComplete="name" />
        <TextField label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <Button type="submit" variant="contained" disabled={sinCambios || !nombre.trim() || !email.trim() || guardar.isPending} sx={{ alignSelf: 'flex-start' }}>
          {guardar.isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Stack>
    </Bloque>
  );
}

function CambiarClave() {
  const notificar = useNotificar();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const noCoincide = confirmar !== '' && confirmar !== nueva;
  const corta = nueva !== '' && nueva.length < 8;
  const cambiar = useMutation({
    mutationFn: () => patch('/api/usuarios/me', { password: nueva, password_actual: actual }),
    onSuccess: () => { setActual(''); setNueva(''); setConfirmar(''); notificar('Contraseña actualizada'); },
    onError: e => notificar(mensaje(e), 'error'),
  });

  return (
    <Bloque titulo="Cambiar contraseña" texto="Usa al menos 8 caracteres.">
      <Stack component="form" spacing={2.5} noValidate onSubmit={(e: FormEvent) => { e.preventDefault(); cambiar.mutate(); }}>
        <TextField label="Contraseña actual" type="password" value={actual} onChange={e => setActual(e.target.value)} required autoComplete="current-password" />
        <TextField
          label="Nueva contraseña" type="password" value={nueva} onChange={e => setNueva(e.target.value)} required autoComplete="new-password"
          error={corta} helperText={corta ? 'Mínimo 8 caracteres' : undefined}
        />
        <TextField
          label="Confirmar nueva contraseña" type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} required autoComplete="new-password"
          error={noCoincide} helperText={noCoincide ? 'Las contraseñas no coinciden' : undefined}
        />
        <Button
          type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}
          disabled={!actual || nueva.length < 8 || nueva !== confirmar || cambiar.isPending}
        >
          {cambiar.isPending ? 'Actualizando…' : 'Cambiar contraseña'}
        </Button>
      </Stack>
    </Bloque>
  );
}

function FormProfesional({ medico }: { medico: Medico }) {
  const qc = useQueryClient();
  const notificar = useNotificar();
  const [especialidad, setEspecialidad] = useState(medico.especialidad);
  const [duracion, setDuracion] = useState(String(medico.duracion_cita));
  useEffect(() => { setEspecialidad(medico.especialidad); setDuracion(String(medico.duracion_cita)); }, [medico]);
  const n = Number(duracion);
  const durInvalida = !Number.isInteger(n) || n < 10 || n > 120;
  const guardar = useMutation({
    mutationFn: () => patch('/api/medicos/perfil', { especialidad: especialidad.trim(), duracion_cita: n }),
    onSuccess: () => {
      notificar('Perfil profesional actualizado');
      qc.invalidateQueries({ queryKey: ['medicos'] });
      qc.invalidateQueries({ queryKey: ['disponibilidad'] });
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  return (
    <Stack component="form" spacing={2.5} noValidate onSubmit={(e: FormEvent) => { e.preventDefault(); guardar.mutate(); }}>
      <TextField label="Especialidad" value={especialidad} onChange={e => setEspecialidad(e.target.value)} required />
      <TextField
        label="Duración de consulta (minutos)" type="number" value={duracion} onChange={e => setDuracion(e.target.value)} required
        slotProps={{ htmlInput: { min: 10, max: 120, step: 5 } }}
        error={durInvalida} helperText={durInvalida ? 'Entre 10 y 120 minutos' : 'Define el tamaño de cada turno en tu agenda'}
      />
      <Button type="submit" variant="contained" disabled={!especialidad.trim() || durInvalida || guardar.isPending} sx={{ alignSelf: 'flex-start' }}>
        {guardar.isPending ? 'Guardando…' : 'Guardar perfil profesional'}
      </Button>
    </Stack>
  );
}

function PerfilProfesional() {
  const q = useQuery({ queryKey: ['medicos', 'perfil'], queryFn: () => get<Medico>('/api/medicos/perfil') });
  return (
    <Bloque titulo="Perfil profesional" texto="Así te ven los pacientes al agendar.">
      <Consulta q={q} filas={2}>{m => <FormProfesional medico={m} />}</Consulta>
    </Bloque>
  );
}

export default function Perfil() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <Encabezado antetitulo="Perfil" titulo="Mi perfil" />
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Iniciales nombre={user.nombre} size={64} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h2" noWrap>{user.nombre}</Typography>
              <Typography color="text.secondary" noWrap>{user.email}</Typography>
              <Typography variant="overline" color="primary">{nombreRol[user.rol]}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'start', '& > *': { minWidth: 0 } }}>
        <DatosPersonales />
        <CambiarClave />
        {user.rol === 'medico' && <PerfilProfesional />}
      </Box>
    </>
  );
}
