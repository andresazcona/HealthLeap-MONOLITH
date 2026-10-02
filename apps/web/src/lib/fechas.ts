// Todo se guarda en UTC; se muestra en hora de Colombia (UTC-5 todo el año, sin horario de verano).
export const TZ = 'America/Bogota';

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-CO', { timeZone: TZ, ...opts });

export const hora = (iso: string) => fmt({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
export const fechaCorta = (iso: string) => fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
export const fechaLarga = (iso: string) => fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
export const fechaHora = (iso: string) => fmt({ day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
export const diaSemana = (iso: string) => fmt({ weekday: 'short' }).format(new Date(iso));
export const diaMes = (iso: string) => fmt({ day: 'numeric' }).format(new Date(iso));

/** YYYY-MM-DD en hora de Colombia, desplazado n días desde hoy. */
export const hoyMas = (dias = 0) => new Date(Date.now() + dias * 864e5).toLocaleDateString('en-CA', { timeZone: TZ });

/** Fecha (YYYY-MM-DD) + hora local (HH:MM) de Colombia a ISO UTC. */
export const aUtc = (fecha: string, hhmm: string) => new Date(`${fecha}T${hhmm}:00-05:00`).toISOString();

/** Mediodía de un día de Colombia: sirve para formatear fechas sin que el cambio de zona mueva el día. */
export const mediodia = (fecha: string) => `${fecha}T17:00:00.000Z`;

export const esFutura = (iso: string) => new Date(iso).getTime() > Date.now();
