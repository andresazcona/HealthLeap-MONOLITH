import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  InputAdornment, Link, MenuItem, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField,
  Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import PersonAddRounded from '@mui/icons-material/PersonAddRounded';
import { Encabezado } from '../../components/Encabezado';
import { Consulta, Vacio } from '../../components/Estados';
import { Confirmar } from '../../components/Confirmar';
import { Iniciales } from '../../components/Iniciales';
import { del, get, post, put } from '../../lib/api';
import { nombreRol, useAuth } from '../../lib/auth';
import { mensaje, useNotificar } from '../../lib/notificar';
import { fechaCorta } from '../../lib/fechas';
import type { Admision, Rol, Usuario } from '../../lib/types';

const ROLES: Rol[] = ['paciente', 'medico', 'admisión', 'admin'];
const colorRol: Record<Rol, 'default' | 'primary' | 'info' | 'warning'> = { paciente: 'default', medico: 'primary', 'admisión': 'info', admin: 'warning' };
const emailValido = (e: string) => /\S+@\S+\.\S+/.test(e);
const sinTexto = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

const useUsuarios = () => useQuery({ queryKey: ['usuarios', 'admin'], queryFn: () => get<Usuario[]>('/api/usuarios?limit=100') });

function Buscador({ valor, onChange, etiqueta }: { valor: string; onChange: (v: string) => void; etiqueta: string }) {
  return (
    <TextField placeholder={etiqueta} value={valor} onChange={e => onChange(e.target.value)} sx={{ maxWidth: 380 }}
      slotProps={{ htmlInput: { 'aria-label': etiqueta }, input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }} />
  );
}

function Acciones({ nombre, onEditar, onEliminar, bloqueo }: { nombre: string; onEditar: () => void; onEliminar: () => void; bloqueo?: string }) {
  return (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
      <Tooltip title="Editar"><IconButton aria-label={`Editar a ${nombre}`} onClick={onEditar}><EditRounded fontSize="small" /></IconButton></Tooltip>
      <Tooltip title={bloqueo ?? 'Eliminar'}>
        <span><IconButton aria-label={`Eliminar a ${nombre}`} onClick={onEliminar} color="error" disabled={Boolean(bloqueo)}><DeleteRounded fontSize="small" /></IconButton></span>
      </Tooltip>
    </Stack>
  );
}

/* ---------- Usuarios ---------- */

function DialogoUsuario({ usuario, yo, onCerrar }: { usuario: Usuario | null; yo: string; onCerrar: () => void }) {
  const nuevo = !usuario;
  const esYo = usuario?.id === yo;
  const qc = useQueryClient();
  const notificar = useNotificar();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? 'paciente');

  const guardar = useMutation({
    mutationFn: () => {
      if (nuevo) return post('/api/usuarios', { nombre: nombre.trim(), email: email.trim(), password, rol });
      const cambios: Partial<Usuario> & { password?: string } = {};
      if (nombre.trim() !== usuario.nombre) cambios.nombre = nombre.trim();
      if (email.trim() !== usuario.email) cambios.email = email.trim();
      if (rol !== usuario.rol) cambios.rol = rol;
      if (password) cambios.password = password;
      return Object.keys(cambios).length ? put(`/api/usuarios/${usuario.id}`, cambios) : Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      qc.invalidateQueries({ queryKey: ['admision'] });
      notificar(nuevo ? 'Usuario creado' : 'Cambios guardados');
      onCerrar();
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const valido = nombre.trim().length >= 3 && emailValido(email) && (nuevo ? password.length >= 8 : !password || password.length >= 8);
  const enviar = (e: FormEvent) => { e.preventDefault(); if (valido) guardar.mutate(); };

  return (
    <Dialog open onClose={onCerrar} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={enviar} noValidate sx={{ display: 'contents' }}>
      <DialogTitle sx={{ fontWeight: 600 }}>{nuevo ? 'Nuevo usuario' : 'Editar usuario'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField label="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required autoFocus />
          <TextField label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="off" />
          <TextField
            label={nuevo ? 'Contraseña' : 'Nueva contraseña (opcional)'}
            type="text" value={password} onChange={e => setPassword(e.target.value)} required={nuevo} autoComplete="new-password"
            error={password.length > 0 && password.length < 8}
            helperText={nuevo ? 'Mínimo 8 caracteres' : 'Déjala vacía para conservar la actual. Mínimo 8 caracteres.'}
          />
          <TextField select label="Rol" value={rol} onChange={e => setRol(e.target.value as Rol)} disabled={esYo}
            helperText={esYo ? 'No puedes cambiar tu propio rol.' : undefined}>
            {ROLES.map(r => <MenuItem key={r} value={r}>{nombreRol[r]}</MenuItem>)}
          </TextField>
          {rol === 'medico' && rol !== usuario?.rol && (
            <Alert severity="info">
              Este rol no crea el perfil del médico (especialidad y agenda). Para dar de alta un médico usa{' '}
              <Link component={RouterLink} to="/admin/medicos">Médicos</Link>.
            </Alert>
          )}
          {rol === 'admisión' && rol !== usuario?.rol && (
            <Alert severity="info">Para asignarle un área, agrégalo en la pestaña “Personal de admisión”.</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={!valido || guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : nuevo ? 'Crear usuario' : 'Guardar'}
        </Button>
      </DialogActions>
      </Box>
    </Dialog>
  );
}

function TabUsuarios({ movil }: { movil: boolean }) {
  const yo = useAuth().user?.id ?? '';
  const qc = useQueryClient();
  const notificar = useNotificar();
  const q = useUsuarios();
  const [buscar, setBuscar] = useState('');
  const [filtroRol, setFiltroRol] = useState<Rol | null>(null);
  const [editando, setEditando] = useState<Usuario | null | undefined>(undefined);
  const [borrando, setBorrando] = useState<Usuario | null>(null);

  const eliminar = useMutation({
    mutationFn: (u: Usuario) => del(`/api/usuarios/${u.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      qc.invalidateQueries({ queryKey: ['admision'] });
      qc.invalidateQueries({ queryKey: ['medicos'] });
      notificar('Usuario eliminado');
      setBorrando(null);
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const t = buscar.trim().toLowerCase();
  const filtrados = (q.data ?? []).filter(u => (!filtroRol || u.rol === filtroRol) && (!t || u.nombre.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)));
  const cuenta = (r: Rol) => q.data?.filter(u => u.rol === r).length ?? 0;
  const acciones = (u: Usuario) => (
    <Acciones nombre={u.nombre} onEditar={() => setEditando(u)} onEliminar={() => setBorrando(u)} bloqueo={u.id === yo ? 'No puedes eliminar tu propia cuenta' : undefined} />
  );

  return (
    <>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Buscador valor={buscar} onChange={setBuscar} etiqueta="Buscar por nombre o correo" />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap role="group" aria-label="Filtrar por rol" sx={{ flex: 1 }}>
          <Chip label={`Todos · ${q.data?.length ?? 0}`} onClick={() => setFiltroRol(null)} color={!filtroRol ? 'primary' : 'default'} variant={!filtroRol ? 'filled' : 'outlined'} />
          {ROLES.map(r => (
            <Chip key={r} label={`${nombreRol[r]} · ${cuenta(r)}`} onClick={() => setFiltroRol(r)} color={filtroRol === r ? 'primary' : 'default'} variant={filtroRol === r ? 'filled' : 'outlined'} />
          ))}
        </Stack>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setEditando(null)} sx={{ flexShrink: 0 }}>Nuevo usuario</Button>
      </Stack>

      <Box sx={{ p: q.isLoading || q.error ? 2 : 0 }}>
        <Consulta q={{ ...q, data: q.data && filtrados }} vacio={<Vacio titulo="Sin resultados" texto="No hay usuarios que coincidan con el filtro." />}>
          {lista => movil ? (
            <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
              {lista.map(u => (
                <CardContent key={u.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Iniciales nombre={u.nombre} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={600} noWrap>{u.nombre}{u.id === yo && ' (tú)'}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{u.email}</Typography>
                    <Chip size="small" label={nombreRol[u.rol]} color={colorRol[u.rol]} variant="outlined" sx={{ mt: 0.5 }} />
                  </Box>
                  {acciones(u)}
                </CardContent>
              ))}
            </Stack>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Creado</TableCell>
                    <TableCell align="right"><Box component="span" sx={sinTexto}>Acciones</Box></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lista.map(u => (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Iniciales nombre={u.nombre} size={36} />
                          <Typography variant="body2" fontWeight={600}>{u.nombre}{u.id === yo && <Typography component="span" variant="caption" color="text.secondary"> (tú)</Typography>}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{u.email}</Typography></TableCell>
                      <TableCell><Chip size="small" label={nombreRol[u.rol]} color={colorRol[u.rol]} variant="outlined" /></TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{u.created_at ? fechaCorta(u.created_at) : '—'}</TableCell>
                      <TableCell align="right">{acciones(u)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Consulta>
      </Box>

      {editando !== undefined && <DialogoUsuario key={editando?.id ?? 'nuevo'} usuario={editando} yo={yo} onCerrar={() => setEditando(undefined)} />}
      <Confirmar
        abierto={Boolean(borrando)}
        titulo="Eliminar usuario"
        texto={<>Se eliminará la cuenta de <b>{borrando?.nombre}</b> ({borrando?.email}). Esta acción no se puede deshacer.</>}
        confirmar={eliminar.isPending ? 'Eliminando…' : 'Eliminar'}
        peligro
        cargando={eliminar.isPending}
        onConfirmar={() => borrando && eliminar.mutate(borrando)}
        onCerrar={() => setBorrando(null)}
      />
    </>
  );
}

/* ---------- Personal de admisión ---------- */

function DialogoAdmision({ registro, asignados, onCerrar }: { registro: Admision | null; asignados: Set<string>; onCerrar: () => void }) {
  const nuevo = !registro;
  const qc = useQueryClient();
  const notificar = useNotificar();
  const usuarios = useUsuarios();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [area, setArea] = useState(registro?.area ?? '');

  const guardar = useMutation({
    mutationFn: () => nuevo
      ? post('/api/admision', { usuario_id: usuario!.id, area: area.trim() })
      : put(`/api/admision/${registro.id}`, { area: area.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admision'] });
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      notificar(nuevo ? 'Personal agregado' : 'Área actualizada');
      onCerrar();
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const opciones = (usuarios.data ?? []).filter(u => !asignados.has(u.id) && u.rol !== 'medico' && u.rol !== 'admin');
  const valido = area.trim().length > 0 && (!nuevo || usuario);
  const enviar = (e: FormEvent) => { e.preventDefault(); if (valido) guardar.mutate(); };

  return (
    <Dialog open onClose={onCerrar} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={enviar} noValidate sx={{ display: 'contents' }}>
      <DialogTitle sx={{ fontWeight: 600 }}>{nuevo ? 'Agregar personal de admisión' : `Editar área de ${registro.nombre}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {nuevo && (
            <>
              <Autocomplete
                options={opciones}
                loading={usuarios.isLoading}
                value={usuario}
                onChange={(_, v) => setUsuario(v)}
                getOptionLabel={u => `${u.nombre} · ${u.email}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                noOptionsText="No hay usuarios disponibles"
                renderInput={p => <TextField {...p} label="Usuario" required autoFocus helperText="Crea primero la cuenta en la pestaña “Usuarios” si no aparece." />}
              />
              {usuario && usuario.rol !== 'admisión' && (
                <Alert severity="warning">El rol de {usuario.nombre} cambiará de {nombreRol[usuario.rol]} a Admisión.</Alert>
              )}
            </>
          )}
          <TextField label="Área" value={area} onChange={e => setArea(e.target.value)} required autoFocus={!nuevo} helperText="Ej.: Recepción principal" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={!valido || guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : nuevo ? 'Agregar' : 'Guardar'}
        </Button>
      </DialogActions>
      </Box>
    </Dialog>
  );
}

function TabAdmision({ movil }: { movil: boolean }) {
  const qc = useQueryClient();
  const notificar = useNotificar();
  const q = useQuery({ queryKey: ['admision', 'admin'], queryFn: () => get<Admision[]>('/api/admision?limit=100') });
  const [buscar, setBuscar] = useState('');
  const [editando, setEditando] = useState<Admision | null | undefined>(undefined);
  const [borrando, setBorrando] = useState<Admision | null>(null);

  const quitar = useMutation({
    mutationFn: (a: Admision) => del(`/api/admision/${a.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admision'] });
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      notificar('Personal retirado');
      setBorrando(null);
    },
    onError: e => notificar(mensaje(e), 'error'),
  });

  const t = buscar.trim().toLowerCase();
  const filtrados = (q.data ?? []).filter(a => !t || [a.nombre, a.email, a.area].some(v => v.toLowerCase().includes(t)));
  const asignados = new Set((q.data ?? []).map(a => a.usuario_id));
  const acciones = (a: Admision) => <Acciones nombre={a.nombre} onEditar={() => setEditando(a)} onEliminar={() => setBorrando(a)} />;

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Buscador valor={buscar} onChange={setBuscar} etiqueta="Buscar por nombre, correo o área" />
        <Button variant="contained" startIcon={<PersonAddRounded />} onClick={() => setEditando(null)}>Agregar personal</Button>
      </Stack>

      <Box sx={{ p: q.isLoading || q.error ? 2 : 0 }}>
        <Consulta q={{ ...q, data: q.data && filtrados }} vacio={
          <Vacio titulo={t ? 'Sin resultados' : 'Aún no hay personal de admisión'} texto={t ? 'Prueba con otro término.' : 'Agrega a un usuario existente y asígnale un área.'} />
        }>
          {lista => movil ? (
            <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
              {lista.map(a => (
                <CardContent key={a.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Iniciales nombre={a.nombre} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={600} noWrap>{a.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{a.email}</Typography>
                    <Typography variant="body2">{a.area}</Typography>
                  </Box>
                  {acciones(a)}
                </CardContent>
              ))}
            </Stack>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Área</TableCell>
                    <TableCell align="right"><Box component="span" sx={sinTexto}>Acciones</Box></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lista.map(a => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Iniciales nombre={a.nombre} size={36} />
                          <Typography variant="body2" fontWeight={600}>{a.nombre}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{a.email}</Typography></TableCell>
                      <TableCell>{a.area}</TableCell>
                      <TableCell align="right">{acciones(a)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Consulta>
      </Box>

      {editando !== undefined && <DialogoAdmision key={editando?.id ?? 'nuevo'} registro={editando} asignados={asignados} onCerrar={() => setEditando(undefined)} />}
      <Confirmar
        abierto={Boolean(borrando)}
        titulo="Retirar del personal de admisión"
        texto={<>Se retirará a <b>{borrando?.nombre}</b> del personal de admisión. Su cuenta de usuario no se elimina.</>}
        confirmar={quitar.isPending ? 'Retirando…' : 'Retirar'}
        peligro
        cargando={quitar.isPending}
        onConfirmar={() => borrando && quitar.mutate(borrando)}
        onCerrar={() => setBorrando(null)}
      />
    </>
  );
}

export default function Usuarios() {
  const movil = useMediaQuery(useTheme().breakpoints.down('md'));
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <Encabezado antetitulo="Administración" titulo="Usuarios" subtitulo="Cuentas, roles y personal de recepción." />
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }} aria-label="Secciones de usuarios">
          <Tab label="Usuarios" />
          <Tab label="Personal de admisión" />
        </Tabs>
        {tab === 0 ? <TabUsuarios movil={movil} /> : <TabAdmision movil={movil} />}
      </Card>
    </Box>
  );
}
