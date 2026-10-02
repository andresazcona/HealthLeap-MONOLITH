// Consola de demo de HealthLeap: llama a la misma API que usaría cualquier cliente.
const $ = id => document.getElementById(id);
let token = null;
let user = null;

const TZ = 'America/Bogota';
const hora = iso => new Date(iso).toLocaleTimeString('es-CO', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const fechaHora = iso => new Date(iso).toLocaleString('es-CO', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' });
// Colombia es UTC-5 todo el año (sin horario de verano)
const aUtc = (fecha, hhmm) => new Date(`${fecha}T${hhmm}:00-05:00`).toISOString();
const hoy = (dias = 0) => new Date(Date.now() + dias * 864e5).toLocaleDateString('en-CA', { timeZone: TZ });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function toast(msg, bad = false) {
  const t = $('toast');
  t.textContent = msg;
  t.className = bad ? 'bad' : '';
  t.style.display = 'block';
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.style.display = 'none'), 3500);
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detalle = json.details?.map(d => d.message).join(', ');
    throw new Error(detalle || json.message || `Error ${res.status}`);
  }
  return json.data;
}

const run = fn => async () => { try { await fn(); } catch (e) { toast(e.message, true); } };

// --- Sesión ---
$('entrar').onclick = run(async () => {
  const data = await api('POST', '/api/auth/login', { email: $('cuenta').value, password: 'Demo1234!' });
  token = data.accessToken;
  user = data.user;
  $('quien').textContent = `${user.nombre} · ${user.rol}`;
  document.querySelectorAll('[data-rol]').forEach(el => el.classList.toggle('hidden', !el.dataset.rol.split(' ').includes(user.rol)));
  $('tituloCitas').textContent = user.rol === 'medico' ? 'Mi agenda' : 'Mis citas';
  if (user.rol === 'paciente') { await cargarEspecialidades(); }
  if (user.rol === 'paciente' || user.rol === 'medico') { await cargarCitas(); }
  if (user.rol === 'admisión' || user.rol === 'admin') { await cargarAgenda(); }
  $('resumen').innerHTML = '';
  toast(`Sesión iniciada como ${user.rol}`);
});

// --- Paciente: agendar ---
async function cargarEspecialidades() {
  const esp = await api('GET', '/api/medicos/especialidades');
  const nombres = esp.map(e => (typeof e === 'string' ? e : e.especialidad));
  $('especialidad').innerHTML = nombres.map(n => `<option>${esc(n)}</option>`).join('');
  await cargarMedicos();
}

async function cargarMedicos() {
  const meds = await api('GET', `/api/medicos/buscar?especialidad=${encodeURIComponent($('especialidad').value)}`);
  $('medico').innerHTML = (meds.medicos ?? meds).map(m => `<option value="${m.id}">${esc(m.nombre)}</option>`).join('');
  $('horarios').innerHTML = '';
}
$('especialidad').onchange = run(cargarMedicos);

$('verHorarios').onclick = run(async () => {
  const d = await api('GET', `/api/disponibilidad/medico/${$('medico').value}/fecha/${$('fecha').value}`);
  const libres = d.bloquesDisponibles.filter(b => new Date(b.inicio) > new Date());
  $('horarios').innerHTML = libres.length
    ? libres.map(b => `<button class="slot" data-inicio="${b.inicio}">${hora(b.inicio)}</button>`).join('')
    : '<span class="muted">No hay horarios libres ese día.</span>';
});

$('horarios').onclick = e => {
  const inicio = e.target.dataset?.inicio;
  if (!inicio) return;
  run(async () => {
    await api('POST', '/api/citas', { medico_id: $('medico').value, fecha_hora: inicio });
    toast(`Cita agendada a las ${hora(inicio)}`);
    $('verHorarios').click();
    await cargarCitas();
  })();
};

// --- Paciente y médico: citas ---
const etiqueta = estado => `<span class="tag">${esc(estado)}</span>`;

async function cargarCitas() {
  const citas = await api('GET', '/api/citas/mis-citas?limit=50');
  const otro = user.rol === 'medico' ? 'Paciente' : 'Médico';
  $('tablaCitas').innerHTML = `<tr><th>Fecha</th><th>${otro}</th><th>Especialidad</th><th>Estado</th><th></th></tr>` +
    (citas.length ? citas.map(c => {
      let accion = '';
      if (user.rol === 'paciente' && c.estado === 'agendada') accion = `<button data-cancelar="${c.id}">Cancelar</button>`;
      if (user.rol === 'medico' && c.estado === 'en espera') accion = `<button class="primary" data-atender="${c.id}">Marcar atendida</button>`;
      return `<tr><td>${fechaHora(c.fecha_hora)}</td><td>${esc(user.rol === 'medico' ? c.nombre_paciente : c.nombre_medico)}</td><td>${esc(c.especialidad)}</td><td>${etiqueta(c.estado)}</td><td>${accion}</td></tr>`;
    }).join('') : '<tr><td colspan="5" class="muted">Sin citas.</td></tr>');
}
$('recargarCitas').onclick = run(cargarCitas);

$('tablaCitas').onclick = e => {
  const { cancelar, atender } = e.target.dataset || {};
  if (cancelar) run(async () => { await api('PATCH', `/api/citas/${cancelar}/cancelar`); toast('Cita cancelada'); await cargarCitas(); })();
  if (atender) run(async () => { await api('PATCH', `/api/citas/${atender}/atendida`); toast('Cita atendida'); await cargarCitas(); })();
};

// --- Médico: bloquear ---
$('bloquear').onclick = run(async () => {
  const f = $('bFecha').value;
  await api('POST', '/api/disponibilidad/bloquear', {
    fecha: f,
    bloques_bloqueados: [{ inicio: aUtc(f, $('bInicio').value), fin: aUtc(f, $('bFin').value) }],
  });
  toast(`Bloqueado ${$('bInicio').value}–${$('bFin').value} el ${f}`);
});

// --- Admisión y admin: agenda del día ---
async function cargarAgenda() {
  const citas = await api('GET', `/api/citas/agenda-diaria?fecha=${$('aFecha').value}`);
  $('tablaAgenda').innerHTML = '<tr><th>Hora</th><th>Paciente</th><th>Médico</th><th>Estado</th><th></th></tr>' +
    (citas.length ? citas.map(c => `<tr><td>${hora(c.fecha_hora)}</td><td>${esc(c.nombre_paciente)}</td><td>${esc(c.nombre_medico)}</td><td>${etiqueta(c.estado)}</td><td>${
      c.estado === 'agendada' ? `<button class="primary" data-llego="${c.id}">Marcar llegada</button>` : ''}</td></tr>`).join('')
      : '<tr><td colspan="5" class="muted">No hay citas ese día.</td></tr>');
}
$('verAgenda').onclick = run(cargarAgenda);

$('tablaAgenda').onclick = e => {
  const id = e.target.dataset?.llego;
  if (id) run(async () => { await api('PATCH', `/api/citas/${id}/en-espera`); toast('Paciente en espera: la médica ya puede atenderlo'); await cargarAgenda(); })();
};

// --- Admin: reportes ---
$('verResumen').onclick = run(async () => {
  const r = await api('GET', '/api/reportes/resumen');
  const items = [['Total', r.total], ['Agendadas', r.agendadas], ['En espera', r.enEspera], ['Atendidas', r.atendidas], ['Canceladas', r.canceladas],
    ...Object.entries(r.porEspecialidad || {})];
  $('resumen').innerHTML = items.map(([k, v]) => `<div class="stat"><span class="muted">${esc(k)}</span><b>${v}</b></div>`).join('');
});

$('descargarCsv').onclick = run(async () => {
  const res = await fetch('/api/reportes/citas/csv', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('No se pudo generar el CSV');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(await res.blob());
  a.download = 'reporte-citas.csv';
  a.click();
});

// Fechas por defecto
$('fecha').value = hoy(1);
$('bFecha').value = hoy(1);
$('aFecha').value = hoy(1);
