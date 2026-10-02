import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { getToken } from '../lib/api';
import { useNotificar } from '../lib/notificar';

/**
 * Aviso en tiempo real cuando admisión marca la llegada de un paciente.
 * Necesita un servidor con WebSockets (local o Docker); en serverless simplemente no conecta.
 */
export function AvisosMedico() {
  const notificar = useNotificar();
  const qc = useQueryClient();

  useEffect(() => {
    const socket = io({ auth: { token: getToken() }, reconnectionAttempts: 3 });
    socket.on('paciente-en-espera', (d: { nombrePaciente: string }) => {
      notificar(`${d.nombrePaciente} llegó y está en sala de espera`, 'info');
      qc.invalidateQueries({ queryKey: ['citas'] });
    });
    return () => { socket.disconnect(); };
  }, [notificar, qc]);

  return null;
}
