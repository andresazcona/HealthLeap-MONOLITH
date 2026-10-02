import { useQuery } from '@tanstack/react-query';
import { get } from '../../lib/api';
import { esFutura } from '../../lib/fechas';
import type { Cita } from '../../lib/types';

// ponytail: trae hasta 100 citas; paginar si un paciente supera eso.
export const useMisCitas = () =>
  useQuery({ queryKey: ['citas', 'mis'], queryFn: () => get<Cita[]>('/api/citas/mis-citas?limit=100') });

/** Próxima = futura y aún activa (agendada o en espera). */
export const esProxima = (c: Cita) => esFutura(c.fecha_hora) && (c.estado === 'agendada' || c.estado === 'en espera');

export const proximas = (citas: Cita[]) =>
  citas.filter(esProxima).sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
