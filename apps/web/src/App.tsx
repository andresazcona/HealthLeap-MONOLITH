import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth, inicioPorRol } from './lib/auth';
import type { Rol } from './lib/types';
import { Shell } from './components/Shell';
import { Acceso } from './pages/Acceso';

const PacienteInicio = lazy(() => import('./pages/paciente/Inicio'));
const PacienteAgendar = lazy(() => import('./pages/paciente/Agendar'));
const PacienteCitas = lazy(() => import('./pages/paciente/MisCitas'));
const MedicoHoy = lazy(() => import('./pages/medico/Hoy'));
const MedicoAgenda = lazy(() => import('./pages/medico/Agenda'));
const MedicoBloqueos = lazy(() => import('./pages/medico/Bloqueos'));
const AdmisionAgenda = lazy(() => import('./pages/admision/AgendaDia'));
const AdmisionDisponibilidad = lazy(() => import('./pages/admision/Disponibilidad'));
const AdminPanel = lazy(() => import('./pages/admin/Panel'));
const AdminMedicos = lazy(() => import('./pages/admin/Medicos'));
const AdminUsuarios = lazy(() => import('./pages/admin/Usuarios'));
const AdminReportes = lazy(() => import('./pages/admin/Reportes'));
const Perfil = lazy(() => import('./pages/Perfil'));

const Spinner = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}><CircularProgress /></Box>
);

function Solo({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.rol)) return <Navigate to={inicioPorRol[user.rol]} replace />;
  return <>{children}</>;
}

export function App() {
  const { user, cargando } = useAuth();
  if (cargando) return <Spinner />;

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={user ? <Navigate to={inicioPorRol[user.rol]} replace /> : <Acceso />} />
        <Route element={user ? <Shell /> : <Navigate to="/" replace />}>
          <Route path="/paciente" element={<Solo roles={['paciente']}><PacienteInicio /></Solo>} />
          <Route path="/paciente/agendar" element={<Solo roles={['paciente']}><PacienteAgendar /></Solo>} />
          <Route path="/paciente/citas" element={<Solo roles={['paciente']}><PacienteCitas /></Solo>} />
          <Route path="/medico" element={<Solo roles={['medico']}><MedicoHoy /></Solo>} />
          <Route path="/medico/agenda" element={<Solo roles={['medico']}><MedicoAgenda /></Solo>} />
          <Route path="/medico/bloqueos" element={<Solo roles={['medico']}><MedicoBloqueos /></Solo>} />
          <Route path="/admision" element={<Solo roles={['admisión', 'admin']}><AdmisionAgenda /></Solo>} />
          <Route path="/admision/disponibilidad" element={<Solo roles={['admisión', 'admin']}><AdmisionDisponibilidad /></Solo>} />
          <Route path="/admin" element={<Solo roles={['admin']}><AdminPanel /></Solo>} />
          <Route path="/admin/medicos" element={<Solo roles={['admin']}><AdminMedicos /></Solo>} />
          <Route path="/admin/usuarios" element={<Solo roles={['admin']}><AdminUsuarios /></Solo>} />
          <Route path="/admin/reportes" element={<Solo roles={['admin']}><AdminReportes /></Solo>} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
