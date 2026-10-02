import { Avatar } from '@mui/material';

const iniciales = (nombre: string) =>
  nombre.replace(/^(Dra?\.)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

export function Iniciales({ nombre, size = 40 }: { nombre: string; size?: number }) {
  return (
    <Avatar sx={{ width: size, height: size, fontSize: size * 0.38, fontWeight: 600, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      {iniciales(nombre)}
    </Avatar>
  );
}
