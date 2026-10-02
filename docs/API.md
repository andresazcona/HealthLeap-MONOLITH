# API de HealthLeap

Base: `/api`. Respuestas `{ status: 'success', data, pagination? }` o `{ status: 'error', message, details? }`.
Autenticación: `Authorization: Bearer <accessToken>` (lo devuelve el login). Todas las fechas viajan en ISO UTC; la UI las muestra en `America/Bogota`.

Roles: `paciente`, `medico`, `admisión` (con tilde), `admin`.
Estados de cita: `agendada` → `en espera` (admisión marca llegada) → `atendida` (solo el médico de la cita). También `cancelada`.

## Auth
| Método | Ruta | Body | data |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/register` | `{ nombre, email, password }` (siempre crea paciente) | igual que login |

## Usuarios
| Método | Ruta | Quién | Notas |
|---|---|---|---|
| GET | `/usuarios/me` | todos | `Usuario` |
| PATCH | `/usuarios/me` | todos | `{ nombre?, email?, password?, password_actual? }` (password exige password_actual; nunca cambia el rol) |
| GET | `/usuarios?page=&limit=` | admin | `Usuario[]`, `pagination.total` |
| POST | `/usuarios` | admin | `{ nombre, email, password, rol }` |
| PUT | `/usuarios/:id` | admin | `{ nombre?, email?, password?, rol? }` |
| DELETE | `/usuarios/:id` | admin | 204 |

## Médicos
| Método | Ruta | Quién | Notas |
|---|---|---|---|
| GET | `/medicos/especialidades` | público | `string[]` |
| GET | `/medicos/buscar?especialidad=&nombre=&page=&limit=` | público | `Medico[]` (`id, usuario_id, nombre, email, especialidad, centro_id, duracion_cita`) |
| GET | `/medicos?page=&limit=` | admin | `Medico[]` |
| POST | `/medicos/completo` | admin | `{ usuario: { nombre, email, password }, especialidad, centro_id (uuid), duracion_cita (10-120) }` |
| PATCH | `/medicos/:id` | admin | `{ especialidad?, centro_id?, duracion_cita? }` |
| DELETE | `/medicos/:id` | admin | 204 |
| GET | `/medicos/perfil` | médico | su `Medico` |
| PATCH | `/medicos/perfil` | médico | `{ especialidad?, duracion_cita? }` |

## Admisión (personal de recepción)
| Método | Ruta | Quién | Notas |
|---|---|---|---|
| GET | `/admision?page=&limit=` | admin | `Admision[]` (`id, usuario_id, nombre, email, area`) |
| POST | `/admision` | admin | `{ usuario_id, area }` (el usuario debe existir; su rol pasa a `admisión`) |
| PUT | `/admision/:id` | admin | `{ area }` |
| DELETE | `/admision/:id` | admin | 204 |

## Citas
`Cita`: `id, paciente_id, medico_id, fecha_hora, estado, created_at, nombre_paciente, nombre_medico, especialidad, duracion_cita, email_paciente`.

| Método | Ruta | Quién | Notas |
|---|---|---|---|
| POST | `/citas` | paciente, admin | `{ medico_id, fecha_hora }` (admin manda también `paciente_id`). 400 si el horario está ocupado, bloqueado o es pasado |
| GET | `/citas/mis-citas?page=&limit=` | paciente, médico | citas propias, más recientes primero |
| GET | `/citas/medico/agenda?fecha=YYYY-MM-DD&page=&limit=` | médico | sin `fecha` = todas |
| GET | `/citas/agenda-diaria?fecha=YYYY-MM-DD` | admisión, admin | todas las citas del día, todos los médicos |
| GET | `/citas/filtrar?medico_id=&paciente_id=&estado=&fecha_inicio=&fecha_fin=` | admisión, admin | |
| GET | `/citas/:id` | dueño o staff | |
| PUT | `/citas/:id` | paciente (suya), admisión, admin | reprogramar: `{ fecha_hora }` |
| PATCH | `/citas/:id/en-espera` | admisión, admin | solo desde `agendada` |
| PATCH | `/citas/:id/atendida` | médico de la cita | solo desde `en espera` |
| PATCH | `/citas/:id/cancelar` | paciente (suya), admisión, admin | |

## Disponibilidad
| Método | Ruta | Quién | Notas |
|---|---|---|---|
| GET | `/disponibilidad/medico/:medicoId/fecha/:fecha` | público | `{ bloquesDisponibles: {inicio, fin}[], bloquesBloqueados, citasAgendadas: {id, inicio, fin, paciente}[] }`. Horario 8:00-17:00 Colombia |
| GET | `/disponibilidad/agenda-completa/:fecha` | admisión, admin | `{ [medicoId]: Disponibilidad }` |
| POST | `/disponibilidad/bloquear` | médico (propio) o admin (`medico_id`) | `{ fecha: 'YYYY-MM-DD', bloques_bloqueados: [{ inicio, fin }] }` (ISO). Reemplaza los bloqueos de ese día |
| DELETE | `/disponibilidad/medico/:medicoId/fecha/:fecha` | admin | cierra la agenda del día |

## Reportes (admin, salvo `mis-citas`)
Filtros por query: `desde`, `hasta` (ISO), `estado`, `medico_id`.

| Método | Ruta | data |
|---|---|---|
| GET | `/reportes/resumen` | `{ total, agendadas, enEspera, atendidas, canceladas, porEspecialidad: { [esp]: n } }` |
| GET | `/reportes/citas` | `{ id, fecha_hora, estado, paciente_nombre, paciente_email, medico_nombre, especialidad, created_at }[]` |
| GET | `/reportes/citas/csv` | archivo CSV |
| GET | `/reportes/mis-citas` | médico: igual que `/reportes/citas` pero solo suyas |

## Tiempo real
Socket.io en el mismo host (`auth: { token }`). El médico recibe `paciente-en-espera` `{ citaId, nombrePaciente, horaLlegada }` cuando admisión marca la llegada. No disponible en despliegues serverless.
