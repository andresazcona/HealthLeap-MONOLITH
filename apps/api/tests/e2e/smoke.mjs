// Prueba de punta a punta contra la API corriendo y una base con db/seed.sql.
// Uso: API_URL=http://localhost:3000 node tests/e2e/smoke.mjs
const API = process.env.API_URL || 'http://localhost:3000';
const PASS = 'Demo1234!';
let ok = 0, fail = 0;

async function call(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

function check(name, res, expected = [200, 201]) {
  const good = expected.includes(res.status);
  good ? ok++ : fail++;
  console.log(`${good ? 'OK  ' : 'FAIL'} ${res.status} ${name}${good ? '' : ' ' + JSON.stringify(res.body).slice(0, 300)}`);
  return res.body?.data ?? res.body;
}

const login = async email => check(`login ${email}`, await call('POST', '/api/auth/login', { email, password: PASS })).accessToken;
const dia = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const suf = Date.now().toString(36);

check('health', await call('GET', '/api/health'));

// Registro público: siempre crea pacientes aunque pidan otro rol
const reg = check('registro paciente', await call('POST', '/api/auth/register',
  { nombre: 'Prueba E2E', email: `e2e-${suf}@test.com`, password: PASS, rol: 'admin' }));
if (reg?.user?.rol !== 'paciente') { fail++; console.log('FAIL registro con rol admin no se ignoró:', reg?.user?.rol); }
else { ok++; console.log('OK       registro ignora rol admin'); }

const admin = await login('admin@example.com');
const admision = await login('admision@example.com');
const medico = await login('ana.ruiz@example.com');
const paciente = await login('paciente@example.com');

const medicos = check('buscar médicos (público)', await call('GET', '/api/medicos/buscar?especialidad=Cardiolog%C3%ADa'));
const medicoId = (medicos.medicos ?? medicos)[0]?.id;
check('especialidades', await call('GET', '/api/medicos/especialidades'));
check('disponibilidad', await call('GET', `/api/disponibilidad/medico/${medicoId}/fecha/${dia(5)}`));

// Hora única por corrida para no chocar con citas de corridas anteriores
const hora = `${dia(5 + (Date.now() % 20))}T${String(13 + (Date.now() % 8)).padStart(2, '0')}:00:00.000Z`;
const cita = check('agendar cita', await call('POST', '/api/citas', { medico_id: medicoId, fecha_hora: hora }, paciente));
check('cita en horario ocupado se rechaza', await call('POST', '/api/citas', { medico_id: medicoId, fecha_hora: hora }, paciente), [400, 409]);

const mias = check('mis citas', await call('GET', '/api/citas/mis-citas', null, paciente));
if (Array.isArray(mias) && mias.some(c => String(c.motivo ?? '').startsWith('TEST'))) { fail++; console.log('FAIL mis citas trae datos falsos'); }

const agenda = check('agenda del médico', await call('GET', '/api/citas/medico/agenda', null, medico));
if (!Array.isArray(agenda) || !agenda.some(c => c.id === cita.id)) { fail++; console.log('FAIL la agenda del médico no muestra la cita nueva'); }

check('admisión marca llegada', await call('PATCH', `/api/citas/${cita.id}/en-espera`, null, admision));
check('médico marca atendida', await call('PATCH', `/api/citas/${cita.id}/atendida`, null, medico));

const otra = check('agendar segunda cita', await call('POST', '/api/citas', { medico_id: medicoId, fecha_hora: hora.replace(':00:00', ':30:00') }, paciente));
check('paciente cancela', await call('PATCH', `/api/citas/${otra.id}/cancelar`, null, paciente));

check('médico bloquea horario', await call('POST', '/api/disponibilidad/bloquear',
  { fecha: dia(30), bloques_bloqueados: [{ inicio: `${dia(30)}T15:00:00.000Z`, fin: `${dia(30)}T16:00:00.000Z` }] }, medico));

check('no agenda en horario bloqueado', await call('POST', '/api/citas', { medico_id: medicoId, fecha_hora: `${dia(30)}T15:30:00.000Z` }, paciente), [400]);
check('no agenda en el pasado', await call('POST', '/api/citas', { medico_id: medicoId, fecha_hora: '2020-01-01T15:00:00.000Z' }, paciente), [400]);

check('reporte de citas', await call('GET', '/api/reportes/citas', null, admin));
check('reporte resumen', await call('GET', '/api/reportes/resumen', null, admin));
check('reporte del médico', await call('GET', '/api/reportes/mis-citas', null, medico));
check('agenda diaria (admisión)', await call('GET', '/api/citas/agenda-diaria', null, admision));
check('filtrar citas', await call('GET', `/api/citas/filtrar?medico_id=${medicoId}`, null, admin));

const yo = check('paciente intenta hacerse admin', await call('PATCH', '/api/usuarios/me', { rol: 'admin', nombre: 'Pedro Gómez' }, paciente));
if (yo?.rol !== 'paciente') { fail++; console.log('FAIL el perfil permitió cambiar el rol:', yo?.rol); }
check('cambiar contraseña sin la actual se rechaza', await call('PATCH', '/api/usuarios/me', { password: 'OtraClave123' }, paciente), [400]);

const reprog = check('agendar cita para reprogramar', await call('POST', '/api/citas', { medico_id: medicoId, fecha_hora: hora.replace(':00:00', ':00:00').replace(/T\d\d/, 'T21') }, paciente));
check('reprogramar a horario bloqueado se rechaza', await call('PUT', `/api/citas/${reprog.id}`, { fecha_hora: `${dia(30)}T15:30:00.000Z` }, paciente), [400]);

check('paciente no lista usuarios', await call('GET', '/api/usuarios', null, paciente), [403]);
check('sin token no ve citas', await call('GET', '/api/citas/mis-citas'), [401]);

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
