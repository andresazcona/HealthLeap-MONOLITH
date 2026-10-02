import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Container, IconButton, InputAdornment, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import PersonRounded from '@mui/icons-material/PersonRounded';
import MedicalServicesRounded from '@mui/icons-material/MedicalServicesRounded';
import HowToRegRounded from '@mui/icons-material/HowToRegRounded';
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import BlockRounded from '@mui/icons-material/BlockRounded';
import { Logo } from '../components/Logo';
import { useAuth, inicioPorRol } from '../lib/auth';
import { mensaje } from '../lib/notificar';

const DEMO = [
  { rol: 'Paciente', nombre: 'Pedro Gómez', email: 'paciente@example.com', detalle: 'Agenda, reprograma y cancela citas', icon: <PersonRounded /> },
  { rol: 'Admisión', nombre: 'Laura Recepción', email: 'admision@example.com', detalle: 'Agenda del día y llegada de pacientes', icon: <HowToRegRounded /> },
  { rol: 'Médico', nombre: 'Dra. Ana Ruiz · Cardiología', email: 'ana.ruiz@example.com', detalle: 'Sala de espera y consultas del día', icon: <MedicalServicesRounded /> },
  { rol: 'Admin', nombre: 'Admin Demo', email: 'admin@example.com', detalle: 'Indicadores, médicos, usuarios y reportes', icon: <AdminPanelSettingsRounded /> },
];
const CLAVE_DEMO = 'Demo1234!';

const PUNTOS = [
  { icon: <EventAvailableRounded />, texto: 'El paciente ve solo horarios realmente libres y agenda en segundos.' },
  { icon: <NotificationsActiveRounded />, texto: 'Recepción marca la llegada y el médico lo ve en su sala de espera.' },
  { icon: <BlockRounded />, texto: 'Cada médico bloquea su agenda; nadie puede agendar encima.' },
];

export function Acceso() {
  const { login, registrar } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);

  const entrar = async (fn: () => Promise<{ rol: keyof typeof inicioPorRol }>, clave: string) => {
    setError(null);
    setEnviando(clave);
    try {
      const u = await fn();
      navigate(inicioPorRol[u.rol], { replace: true });
    } catch (e) {
      setError(mensaje(e));
    } finally {
      setEnviando(null);
    }
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    entrar(() => (tab === 0 ? login(email, password) : registrar(nombre, email, password)), 'form');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box component="header" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg" sx={{ py: 1.75 }}><Logo size={30} /></Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ maxWidth: 720, mb: { xs: 4, md: 5 } }}>
          <Typography variant="overline" color="primary">Agendamiento médico</Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 44 }, lineHeight: 1.15, mt: 1 }}>
            Tu cita médica, sin filas.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 17 }}>
            Pacientes, recepción y médicos coordinados en una sola agenda.
          </Typography>
        </Box>

        <Typography variant="h4" sx={{ mb: 1.5 }}>Prueba la demo con un clic</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 5 }}>
          {DEMO.map(d => (
            <Card key={d.email}>
              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'primary.main', mb: 2 }}>
                  {d.icon}
                </Box>
                <Typography variant="overline" color="text.secondary">{d.rol}</Typography>
                <Typography variant="h4">{d.nombre}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2, flex: 1 }}>{d.detalle}</Typography>
                <Button
                  variant={d.rol === 'Paciente' ? 'contained' : 'outlined'}
                  endIcon={<ArrowForwardRounded />}
                  disabled={Boolean(enviando)}
                  onClick={() => entrar(() => login(d.email, CLAVE_DEMO), d.email)}
                >
                  {enviando === d.email ? 'Entrando…' : `Entrar como ${d.rol.toLowerCase()}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, alignItems: 'start' }}>
          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(null); }} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Iniciar sesión" />
                <Tab label="Crear cuenta de paciente" />
              </Tabs>
              <Stack component="form" spacing={2.5} onSubmit={enviar} noValidate>
                {tab === 1 && (
                  <TextField label="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required autoComplete="name" />
                )}
                <TextField label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                <TextField
                  label="Contraseña"
                  type={ver ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={tab === 0 ? 'current-password' : 'new-password'}
                  helperText={tab === 1 ? 'Mínimo 8 caracteres' : undefined}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setVer(!ver)} edge="end" aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                            {ver ? <VisibilityOffRounded /> : <VisibilityRounded />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" variant="contained" size="large" disabled={Boolean(enviando)}>
                  {enviando === 'form' ? 'Un momento…' : tab === 0 ? 'Ingresar' : 'Crear cuenta'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Typography variant="h3" sx={{ mb: 2 }}>Cómo funciona</Typography>
              <Stack spacing={2.25}>
                {PUNTOS.map(p => (
                  <Stack key={p.texto} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ color: 'primary.main', mt: 0.25 }}>{p.icon}</Box>
                    <Typography variant="body2">{p.texto}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 3 }}>
                Las cuentas de demo usan la contraseña {CLAVE_DEMO}. Los datos son ficticios.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
