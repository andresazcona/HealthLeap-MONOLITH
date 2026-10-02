import { useState, type ReactElement } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, BottomNavigation, BottomNavigationAction, Box, Divider, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack, Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import HomeRounded from '@mui/icons-material/HomeRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import EventNoteRounded from '@mui/icons-material/EventNoteRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import TodayRounded from '@mui/icons-material/TodayRounded';
import BlockRounded from '@mui/icons-material/BlockRounded';
import ViewWeekRounded from '@mui/icons-material/ViewWeekRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import MedicalServicesRounded from '@mui/icons-material/MedicalServicesRounded';
import AssessmentRounded from '@mui/icons-material/AssessmentRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import { Logo } from './Logo';
import { Iniciales } from './Iniciales';
import { useAuth, nombreRol } from '../lib/auth';
import { useModo } from '../lib/modo';
import type { Rol } from '../lib/types';
import { AvisosMedico } from './AvisosMedico';

interface Item { to: string; label: string; icon: ReactElement }

export const navegacion: Record<Rol, Item[]> = {
  paciente: [
    { to: '/paciente', label: 'Inicio', icon: <HomeRounded /> },
    { to: '/paciente/agendar', label: 'Agendar', icon: <SearchRounded /> },
    { to: '/paciente/citas', label: 'Mis citas', icon: <EventNoteRounded /> },
    { to: '/perfil', label: 'Perfil', icon: <PersonRounded /> },
  ],
  medico: [
    { to: '/medico', label: 'Mi día', icon: <TodayRounded /> },
    { to: '/medico/agenda', label: 'Agenda', icon: <ViewWeekRounded /> },
    { to: '/medico/bloqueos', label: 'Bloquear horarios', icon: <BlockRounded /> },
    { to: '/perfil', label: 'Perfil', icon: <PersonRounded /> },
  ],
  'admisión': [
    { to: '/admision', label: 'Agenda del día', icon: <TodayRounded /> },
    { to: '/admision/disponibilidad', label: 'Disponibilidad', icon: <ViewWeekRounded /> },
    { to: '/perfil', label: 'Perfil', icon: <PersonRounded /> },
  ],
  admin: [
    { to: '/admin', label: 'Panel', icon: <DashboardRounded /> },
    { to: '/admision', label: 'Agenda del día', icon: <TodayRounded /> },
    { to: '/admin/medicos', label: 'Médicos', icon: <MedicalServicesRounded /> },
    { to: '/admin/usuarios', label: 'Usuarios y personal', icon: <GroupRounded /> },
    { to: '/admin/reportes', label: 'Reportes', icon: <AssessmentRounded /> },
    { to: '/perfil', label: 'Perfil', icon: <PersonRounded /> },
  ],
};

const ANCHO = 248;

/** Ruta activa: la más específica que coincide con la URL. */
function activo(items: Item[], path: string) {
  return items.filter(i => path === i.to || path.startsWith(i.to + '/')).sort((a, b) => b.to.length - a.to.length)[0]?.to;
}

export function Shell() {
  const { user, logout } = useAuth();
  const { modo, alternar } = useModo();
  const theme = useTheme();
  const escritorio = useMediaQuery(theme.breakpoints.up('md'));
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const [cajon, setCajon] = useState(false);

  if (!user) return null;
  const items = navegacion[user.rol];
  const actual = activo(items, pathname);
  const paciente = user.rol === 'paciente';

  const lista = (
    <List sx={{ px: 1.5, py: 1 }}>
      {items.map(i => (
        <ListItemButton
          key={i.to}
          component={RouterLink}
          to={i.to}
          selected={actual === i.to}
          onClick={() => setCajon(false)}
          sx={{
            borderRadius: 2, mb: 0.5, minHeight: 44,
            '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText', '& .MuiListItemIcon-root': { color: 'inherit' }, '&:hover': { bgcolor: 'primary.dark' } },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>{i.icon}</ListItemIcon>
          <ListItemText primary={i.label} primaryTypographyProps={{ fontWeight: 500, fontSize: 14 }} />
        </ListItemButton>
      ))}
    </List>
  );

  const usuario = (
    <>
      <Tooltip title={modo === 'light' ? 'Modo oscuro' : 'Modo claro'}>
        <IconButton onClick={alternar} aria-label="Cambiar tema">
          {modo === 'light' ? <DarkModeRounded /> : <LightModeRounded />}
        </IconButton>
      </Tooltip>
      <IconButton onClick={e => setMenu(e.currentTarget)} aria-label="Cuenta" sx={{ p: 0.5 }}>
        <Iniciales nombre={user.nombre} size={34} />
      </IconButton>
      <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography fontWeight={600}>{user.nombre}</Typography>
          <Typography variant="body2" color="text.secondary">{nombreRol[user.rol]} · {user.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setMenu(null); navigate('/perfil'); }}><PersonRounded fontSize="small" sx={{ mr: 1.5 }} />Mi perfil</MenuItem>
        <MenuItem onClick={() => { setMenu(null); logout(); navigate('/'); }}><LogoutRounded fontSize="small" sx={{ mr: 1.5 }} />Cerrar sesión</MenuItem>
      </Menu>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {user.rol === 'medico' && <AvisosMedico />}

      {escritorio && (
        <Drawer variant="permanent" sx={{ width: ANCHO, flexShrink: 0, '& .MuiDrawer-paper': { width: ANCHO, borderRight: 1, borderColor: 'divider' } }}>
          <Box sx={{ px: 2.5, py: 2.25 }}><Logo size={30} /></Box>
          {lista}
          <Box sx={{ mt: 'auto', p: 2 }}>
            <Typography variant="caption" color="text.secondary">Sesión: {nombreRol[user.rol]}</Typography>
          </Box>
        </Drawer>
      )}

      {!escritorio && !paciente && (
        <Drawer open={cajon} onClose={() => setCajon(false)} sx={{ '& .MuiDrawer-paper': { width: ANCHO } }}>
          <Box sx={{ px: 2.5, py: 2.25 }}><Logo size={30} /></Box>
          {lista}
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Toolbar sx={{ gap: 1, minHeight: { xs: 60 } }}>
            {!escritorio && !paciente && (
              <IconButton edge="start" onClick={() => setCajon(true)} aria-label="Abrir menú"><MenuRounded /></IconButton>
            )}
            {!escritorio && <Logo size={28} />}
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={0.5} alignItems="center">{usuario}</Stack>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, width: '100%', maxWidth: 1240, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 4 }, pb: paciente && !escritorio ? 11 : undefined }}>
          <Outlet />
        </Box>
      </Box>

      {!escritorio && paciente && (
        <Paper sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, borderTop: 1, borderColor: 'divider', zIndex: 10 }}>
          <BottomNavigation showLabels value={actual} onChange={(_, v) => navigate(v)}>
            {items.map(i => <BottomNavigationAction key={i.to} value={i.to} label={i.label} icon={i.icon} />)}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
