import { alpha, type Theme } from '@mui/material/styles';
import { TZ } from '../../lib/fechas';

/** YYYY-MM-DD desplazado n días (aritmética de calendario, sin zona). */
export const sumarDias = (fecha: string, n: number) =>
  new Date(Date.parse(`${fecha}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** Día de Colombia (YYYY-MM-DD) de un instante ISO. */
export const diaCol = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });

/** Minutos desde la medianoche de Colombia (UTC-5 fijo, sin horario de verano). */
export const minCol = (iso: string | number) => ((Math.floor(new Date(iso).getTime() / 6e4) - 300) % 1440 + 1440) % 1440;

/** 'HH:MM' a partir de minutos del día. */
export const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Jornada 08:00–17:00 en pasos de 30 min: inicios de franja (08:00 … 16:30). */
export const JORNADA = { inicio: 8 * 60, fin: 17 * 60, paso: 30 };
export const FILAS = Array.from({ length: (JORNADA.fin - JORNADA.inicio) / JORNADA.paso }, (_, i) => JORNADA.inicio + i * JORNADA.paso);

/** Fondo rayado para horarios bloqueados. */
export const rayado = (t: Theme) => ({
  backgroundColor: t.palette.action.hover,
  backgroundImage: `repeating-linear-gradient(135deg, ${alpha(t.palette.text.secondary, 0.14)} 0 6px, transparent 6px 12px)`,
});

/** Primera letra en mayúscula ("viernes, 2 de octubre…" → "Viernes, 2 de octubre…"). */
export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
