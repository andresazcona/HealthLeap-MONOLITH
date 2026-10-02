import { useState } from 'react';
import { Card } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { get, qs } from '../../lib/api';
import { fechaLarga, hoyMas, mediodia } from '../../lib/fechas';
import type { Disponibilidad as Disp, Medico } from '../../lib/types';
import { Encabezado } from '../../components/Encabezado';
import { Consulta, Vacio } from '../../components/Estados';
import { NavFecha } from '../../components/staff/Comun';
import { capital } from '../../components/staff/util';
import { LeyendaFranjas, MatrizFranjas, type ColumnaFranjas } from '../../components/staff/MatrizFranjas';

export default function Disponibilidad() {
  const [fecha, setFecha] = useState(hoyMas(0));

  const medicos = useQuery({
    queryKey: ['medicos', 'buscar', 100],
    queryFn: () => get<Medico[]>(`/api/medicos/buscar${qs({ limit: 100 })}`),
  });
  const agenda = useQuery({
    queryKey: ['disponibilidad', 'agenda-completa', fecha],
    queryFn: () => get<Record<string, Disp>>(`/api/disponibilidad/agenda-completa/${fecha}`),
    refetchInterval: 30_000,
  });

  const columnas: ColumnaFranjas[] | undefined = agenda.data && medicos.data
    && medicos.data
      .filter(m => agenda.data[m.id])
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map(m => ({ id: m.id, titulo: m.nombre, subtitulo: `${m.especialidad} · citas de ${m.duracion_cita} min`, disp: agenda.data[m.id] }));

  return (
    <>
      <Encabezado
        antetitulo="Admisión"
        titulo="Disponibilidad médica"
        subtitulo={capital(fechaLarga(mediodia(fecha)))}
        acciones={<NavFecha fecha={fecha} onFecha={setFecha} />}
      />
      <Consulta
        q={{
          isLoading: medicos.isLoading || agenda.isLoading,
          error: medicos.error || agenda.error,
          data: columnas,
          refetch: () => { medicos.refetch(); agenda.refetch(); },
        }}
        vacio={<Card><Vacio titulo="No hay médicos registrados" /></Card>}
        filas={6}
      >
        {cols => (
          <>
            <LeyendaFranjas />
            <MatrizFranjas fecha={fecha} columnas={cols} />
          </>
        )}
      </Consulta>
    </>
  );
}
