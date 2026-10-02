<div align="center">

# HealthLeap

**API REST para agendamiento médico: pacientes, médicos, admisión y citas en un solo backend.**

[![CI](https://github.com/andresazcona/HealthLeap-MONOLITH/actions/workflows/ci.yml/badge.svg)](https://github.com/andresazcona/HealthLeap-MONOLITH/actions/workflows/ci.yml)
[![CD](https://github.com/andresazcona/HealthLeap-MONOLITH/actions/workflows/cd.yml/badge.svg)](https://github.com/andresazcona/HealthLeap-MONOLITH/actions/workflows/cd.yml)
![Tests](https://img.shields.io/badge/tests-147%20unit%20%C2%B7%2032%20integration%20%C2%B7%2028%20e2e-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

[**Reporte de cobertura**](https://andresazcona.github.io/HealthLeap-MONOLITH/) · [Endpoints](#api) · [Correr local](#correr-local)

</div>

---

## Qué hace

HealthLeap conecta a pacientes, médicos y personal de admisión:

- **Pacientes** buscan médicos por especialidad, ven disponibilidad y agendan, modifican o cancelan citas.
- **Médicos** configuran su agenda, bloquean horarios y marcan citas como atendidas.
- **Admisión** ve la agenda del día y marca la llegada del paciente; el médico recibe el aviso en tiempo real por WebSocket.
- **Administradores** gestionan usuarios y sacan reportes y estadísticas en JSON o CSV.

Además envía por correo confirmaciones, recordatorios y avisos de cancelación.

## Arquitectura

Monolito en capas. Cada request baja por el mismo camino y cada capa se prueba por separado.

```mermaid
flowchart LR
    C[Cliente] -->|HTTP / JWT| M[Middlewares<br/>helmet · cors · rate limit<br/>auth · roles · Joi]
    C <-->|Socket.io| RT[Realtime]
    M --> CT[Controllers]
    CT --> S[Services<br/>lógica de negocio]
    S --> R[Repositories]
    R --> DB[(PostgreSQL)]
    S --> E[Nodemailer]
    S --> RT
```

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Rutas | `src/routes` | Define endpoints y aplica middlewares |
| Middlewares | `src/middlewares` | Autenticación JWT, roles, validación, rate limit, errores |
| Controllers | `src/controllers` | Traduce HTTP a llamadas de servicio |
| Services | `src/services` | Reglas de negocio (choques de horario, estados de cita, etc.) |
| Repositories | `src/repositories` | SQL parametrizado con `pg` |
| Realtime | `src/realtime` | Salas por médico y notificaciones Socket.io |

## Stack

| | |
|---|---|
| **Runtime** | Node.js 18, Express 4, TypeScript 5 |
| **Datos** | PostgreSQL (Neon en la nube) |
| **Seguridad** | JWT access + refresh, bcrypt, helmet, CORS, express-rate-limit, validación con Joi |
| **Tiempo real** | Socket.io |
| **Testing** | Jest, Supertest, e2e con `fetch` contra Postgres real |
| **DevOps** | Docker multi-stage, GitHub Actions (CI + CD a Docker Hub), SonarQube |

## Reglas de negocio

- El registro público **siempre crea pacientes**; médicos, admisión y admins los crea un admin.
- No se puede agendar en el pasado, sobre otra cita del mismo médico ni en un horario que el médico bloqueó.
- Flujo de estados: `agendada` → `en espera` (admisión marca la llegada) → `atendida` (solo el médico de esa cita).
- Un paciente solo ve, modifica y cancela sus propias citas.
- Horario de atención: 8:00 a 17:00 hora Colombia. Todas las fechas se guardan en UTC (`TIMESTAMPTZ`).

## Calidad

- **147 tests unitarios** (servicios y repositorios) y **32 de integración** (rutas con Supertest).
- **E2E contra Postgres real** ([`tests/e2e/smoke.mjs`](tests/e2e/smoke.mjs)): recorre el flujo completo con los cuatro roles, incluidos los casos que deben fallar (horario ocupado, horario bloqueado, cita en el pasado, accesos indebidos).
- La CI corre todo eso en cada push con un Postgres de servicio y publica el [reporte de cobertura](https://andresazcona.github.io/HealthLeap-MONOLITH/) (~58%) en GitHub Pages.
- La CD construye la imagen Docker y la publica en Docker Hub en cada push a `main`.

## Correr local

Requisitos: Node.js 18+ y una base PostgreSQL (local o [Neon](https://neon.tech)).

```bash
git clone https://github.com/andresazcona/HealthLeap-MONOLITH.git
cd HealthLeap-MONOLITH
npm install
cp .env.example .env   # completa DATABASE_URL, JWT_* y EMAIL_*
npm run db:setup       # crea las tablas y carga los datos de demo
npm run dev            # http://localhost:3000
```

Abre **http://localhost:3000**: la API trae una consola web ([`public/`](public)) para probar cada rol sin Postman: agendar, marcar llegada, atender, bloquear horarios y ver reportes.

### Cuentas de demo

Las crea `npm run db:setup`. Todas usan la contraseña `Demo1234!`.

| Rol | Email |
|---|---|
| Admin | `admin@example.com` |
| Admisión | `admision@example.com` |
| Médico | `ana.ruiz@example.com`, `carlos.mendez@example.com`, `sofia.torres@example.com` |
| Paciente | `paciente@example.com`, `maria.lopez@example.com` |

Con Docker:

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app npm run db:setup
```

Verifica que esté arriba:

```bash
curl http://localhost:3000/health
```

### Tests

```bash
npm run test:unit         # unitarios
npm run test:integration  # integración
npm run test:coverage     # cobertura
npm run test:e2e:api      # e2e contra la API corriendo (API_URL, por defecto localhost:3000)
```

## Variables de entorno

Todas están en [`.env.example`](.env.example). Al arrancar se validan con Joi y la app no inicia si falta alguna obligatoria.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | sí | Cadena de conexión PostgreSQL |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | sí | Secretos para firmar tokens |
| `JWT_ACCESS_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | no | Por defecto `2h` / `7d` |
| `EMAIL_USER` / `EMAIL_APP_PASSWORD` | sí | Cuenta para envío de correos |
| `EMAIL_SERVICE` / `EMAIL_FROM` | no | Por defecto `gmail` |
| `PORT` | no | Por defecto `3000` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | no | Por defecto 100 requests cada 15 min |

## API

Todas las rutas van bajo `/api` y, salvo registro, login y health, requieren `Authorization: Bearer <token>`.

<details>
<summary><b>Autenticación</b> · <code>/api/auth</code></summary>

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/register` | Registro de usuario |
| POST | `/login` | Inicio de sesión, devuelve access y refresh token |
| POST | `/refresh-token` | Renueva el access token |
| POST | `/logout` | Cierra sesión |
| POST | `/forgot-password` | Solicita recuperación de contraseña |
| POST | `/reset-password` | Restablece la contraseña |
</details>

<details>
<summary><b>Médicos</b> · <code>/api/medicos</code></summary>

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar médicos (admin) |
| GET | `/especialidades` | Listar especialidades |
| GET | `/buscar` | Buscar por especialidad o nombre (público) |
| GET | `/perfil` | Perfil del médico autenticado |
| GET | `/:id` | Detalle de un médico (admin) |
| POST | `/completo` | Crear usuario + médico en un paso (admin) |
| PATCH | `/perfil` | Actualizar perfil propio |
| PATCH | `/:id` | Actualizar médico (admin) |
| DELETE | `/:id` | Eliminar médico (admin) |
</details>

<details>
<summary><b>Citas</b> · <code>/api/citas</code></summary>

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Todas las citas (admin) |
| GET | `/mis-citas` | Citas del usuario autenticado |
| GET | `/filtrar` | Filtrar por criterios |
| GET | `/medico/agenda` | Agenda del médico |
| GET | `/agenda-diaria` | Agenda del día (admisión) |
| GET | `/:id` | Detalle de una cita |
| POST | `/` | Agendar cita |
| PUT | `/:id` | Modificar cita |
| PATCH | `/:id/estado` | Cambiar estado |
| PATCH | `/:id/en-espera` | Marcar llegada del paciente (admisión, admin) |
| PATCH | `/:id/atendida` | Marcar como atendida (médico) |
| PATCH | `/:id/cancelar` | Cancelar cita |
| DELETE | `/:id` | Cancelar cita (equivalente) |
</details>

<details>
<summary><b>Disponibilidad</b> · <code>/api/disponibilidad</code></summary>

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/medico/:medicoId/fecha/:fecha` | Horarios libres, citas y bloqueos del día (público) |
| GET | `/agenda-completa/:fecha` | Agenda de todos los médicos (admin, admisión) |
| POST | `/bloquear` | Bloquear horarios (médico, o admin con `medico_id`) |
| DELETE | `/medico/:medicoId/fecha/:fecha` | Cerrar agenda del día (admin) |
</details>

<details>
<summary><b>Admisión, usuarios, reportes y notificaciones</b></summary>

| Método | Ruta | Descripción |
|---|---|---|
| GET / POST / PUT / DELETE | `/api/admision[/:id]` | CRUD de personal de admisión |
| GET | `/api/admision/perfil` | Perfil propio |
| GET | `/api/admision/areas` | Áreas de admisión |
| GET / PATCH | `/api/usuarios/me` | Perfil del usuario autenticado |
| GET / POST / PUT / DELETE | `/api/usuarios[/:id]` | CRUD de usuarios (admin) |
| GET | `/api/reportes/citas` | Reporte de citas (JSON). Filtros: `?desde=&hasta=&estado=&medico_id=` |
| GET | `/api/reportes/citas/csv` | Reporte de citas (CSV) |
| GET | `/api/reportes/resumen` | Resumen y estadísticas |
| GET | `/api/reportes/mis-citas` | Reporte del médico autenticado |
| POST | `/api/notify/cita-confirmacion/:citaId` | Correo de confirmación |
| POST | `/api/notify/cita-recordatorio/:citaId` | Correo de recordatorio |
| POST | `/api/notify/recordatorios-masivos` | Recordatorios masivos |
| GET | `/api/health` | Estado del servicio |
</details>

## Estructura

```
src/
├── config/         # entorno (validado con Joi), base de datos, email
├── controllers/
├── middlewares/    # authenticate, authorize, validateSchema, rateLimiter, errorHandler
├── models/
├── realtime/       # Socket.io
├── repositories/
├── routes/
├── services/
├── utils/
├── validators/
├── app.ts
└── server.ts
db/
├── schema.sql      # tablas
├── seed.sql        # datos de demo
└── setup.js        # npm run db:setup
tests/
├── services/  repositories/  integration/
└── e2e/smoke.mjs   # flujo completo contra Postgres real
api/index.js        # entrada para Vercel
```

---

<div align="center">
Hecho por <a href="https://github.com/andresazcona">Andrés Azcona</a>
</div>
