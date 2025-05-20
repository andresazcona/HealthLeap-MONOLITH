# HealthLeap Monolith

Backend monolítico para plataforma de agendamiento médico HealthLeap.

![HealthLeap](https://img.shields.io/badge/HealthLeap-Monolith-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-v18-green)
![Express](https://img.shields.io/badge/Express-v4.19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.4-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v13-orange)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![CI/CD](https://img.shields.io/badge/CI/CD-GitHub_Actions-purple)

## Índice

- Descripción
- Características
- Arquitectura
- Tecnologías
- Requisitos
- Instalación
- Estructura del Proyecto
- Configuración de Entorno
- Ejecución
- API Endpoints
- Tests
- CI/CD
- Despliegue con Docker
- Contribuir

## Descripción

HealthLeap es una plataforma completa para la gestión de citas médicas, agendamiento de consultas y manejo de pacientes. La aplicación conecta médicos, pacientes y personal administrativo en una plataforma unificada para optimizar el proceso de atención médica.

Este repositorio contiene el backend monolítico del sistema, desarrollado con Node.js, Express y TypeScript, usando PostgreSQL como base de datos.

## Características

- **Gestión de usuarios** con roles diferenciados (paciente, médico, admisión, admin)
- **Autenticación y autorización** con JWT
- **Gestión de citas médicas** (agendamiento, modificación, cancelación)
- **Administración de disponibilidad** para médicos
- **Panel de admisión** para recepción de pacientes
- **Notificaciones en tiempo real** con Socket.io
- **Generación de reportes** (CSV, JSON)
- **Estadísticas** sobre agendamiento y atención
- **API RESTful** completamente documentada
- **Sistema de logs** para monitoreo y diagnóstico

## Arquitectura

La aplicación sigue un patrón arquitectónico monolitico en capas:

1. **Controladores**: Manejan las peticiones HTTP y respuestas
2. **Servicios**: Implementan la lógica de negocio
3. **Repositorios**: Gestionan el acceso a datos
4. **Modelos**: Definen las estructuras de datos
5. **Middlewares**: Procesamiento intermedio de peticiones
6. **Utilidades**: Funciones auxiliares compartidas

La comunicación entre componentes se realiza a través de interfaces bien definidas, lo que facilita el mantenimiento y las pruebas unitarias.

## Tecnologías

### Core
- **Node.js** (v18+)
- **Express.js** (v4.19)
- **TypeScript** (v5.4)
- **PostgreSQL** (v13)

### Autenticación y Seguridad
- **JWT** (jsonwebtoken)
- **bcrypt** para hash de contraseñas
- **helmet** para seguridad HTTP
- **cors** para control de acceso
- **express-rate-limit** para protección contra ataques

### Testing
- **Jest** para pruebas unitarias
- **Supertest** para pruebas de integración
- **Newman** para pruebas de API

### Otros
- **Socket.io** para comunicación en tiempo real
- **Winston** para logs
- **Joi** para validación de datos
- **Nodemailer** para envío de correos
- **Docker** para contenerización

## Requisitos

- Node.js v16.0.0 o superior (recomendado v18+)
- npm v8.0.0 o superior
- PostgreSQL 13 o superior
- Docker y Docker Compose (para desarrollo/despliegue con contenedores)

## Instalación

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/HealthLeap-MONOLITH.git
cd HealthLeap-MONOLITH

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
# Editar .env con las configuraciones adecuadas

# Compilar el proyecto
npm run build

# Iniciar la aplicación
npm start
<<<<<<< HEAD:README.MD
```

### Instalación con Docker

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/HealthLeap-MONOLITH.git
cd HealthLeap-MONOLITH

# Crear archivo de variables de entorno
cp .env.example .env
# Editar .env con las configuraciones adecuadas

# Construir y ejecutar con Docker Compose
npm run docker:compose:build
```

## Estructura del Proyecto

```
HealthLeap-MONOLITH/
├── .github/                  # Configuración de GitHub Actions
│   └── workflows/            # Workflows de CI/CD
├── dist/                     # Código compilado (generado)
├── logs/                     # Logs de la aplicación
├── reports/                  # Reportes de pruebas
├── src/                      # Código fuente
│   ├── config/               # Configuraciones
│   ├── controllers/          # Controladores de API
│   ├── middlewares/          # Middlewares de Express
│   ├── models/               # Definiciones de tipos y modelos
│   ├── realtime/             # Gestión de websockets
│   ├── repositories/         # Acceso a datos
│   ├── routes/               # Rutas de API
│   ├── scripts/              # Scripts utilitarios
│   ├── services/             # Lógica de negocio
│   ├── utils/                # Funciones auxiliares
│   ├── validators/           # Esquemas de validación
│   ├── app.ts                # Configuración de Express
│   └── server.ts             # Punto de entrada
├── temp/                     # Archivos temporales
├── tests/                    # Pruebas
│   ├── integration/          # Pruebas de integración
│   ├── repositories/         # Pruebas de repositorios
│   ├── services/             # Pruebas de servicios
│   ├── unit/                 # Pruebas unitarias
│   └── setup.js              # Configuración de test
├── .dockerignore             # Archivos ignorados por Docker
├── .env                      # Variables de entorno (no versionado)
├── .env.example              # Ejemplo de variables de entorno
├── .eslintrc                 # Configuración de ESLint
├── .gitignore                # Archivos ignorados por git
├── Dockerfile                # Configuración de Docker
├── docker-compose.yml        # Configuración de Docker Compose
├── jest.config.js            # Configuración de Jest
├── package.json              # Dependencias y scripts
├── README.md                 # Este archivo
├── sonar-project.properties  # Configuración de SonarQube
└── tsconfig.json             # Configuración de TypeScript
```

## Configuración de Entorno

Crea un archivo .env en la raíz del proyecto con las siguientes variables:

```env
# Servidor
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CORS_ORIGIN=*

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=healthleap
DB_PASS=healthleap
DB_NAME=healthleap_db

# Autenticación
JWT_SECRET=tu_secreto_jwt
JWT_REFRESH_SECRET=tu_secreto_refresh
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=usuario@example.com
EMAIL_PASS=tu_contraseña
EMAIL_FROM=noreply@example.com

# Logs
LOG_LEVEL=info

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Ejecución

### Desarrollo

```bash
# Iniciar en modo desarrollo (con hot-reload)
npm run dev

# Verificación de tipos
npm run lint
```

### Producción

```bash
# Compilar el código
npm run build

# Iniciar la aplicación
npm start
```

### Docker

```bash
# Construir imagen
npm run docker:build

# Ejecutar el contenedor
npm run docker:run

# Ejecutar con Docker Compose (incluye Redis)
npm run docker:compose
```

## API Endpoints

La API sigue principios REST y utiliza JWT para autenticación.

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de nuevos usuarios |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Refrescar token de acceso |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/forgot-password` | Solicitar recuperación de contraseña |
| POST | `/api/auth/reset-password` | Restablecer contraseña |

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/usuarios` | Listar usuarios (Admin) |
| GET | `/api/usuarios/:id` | Obtener usuario por ID (Admin) |
| POST | `/api/usuarios` | Crear usuario (Admin) |
| PUT | `/api/usuarios/:id` | Actualizar usuario (Admin) |
| DELETE | `/api/usuarios/:id` | Eliminar usuario (Admin) |

### Médicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/medicos` | Listar médicos |
| GET | `/api/medicos/especialidades` | Listar especialidades |
| GET | `/api/medicos/buscar` | Buscar médicos por filtros |
| GET | `/api/medicos/:id` | Obtener médico por ID |
| GET | `/api/medicos/perfil` | Obtener perfil del médico actual |
| POST | `/api/medicos` | Crear médico (Admin) |
| PATCH | `/api/medicos/perfil` | Actualizar perfil de médico |
| DELETE | `/api/medicos/:id` | Eliminar médico (Admin) |

### Citas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/citas` | Listar todas las citas (Admin) |
| GET | `/api/citas/mis-citas` | Listar citas del usuario actual |
| GET | `/api/citas/:id` | Obtener cita por ID |
| GET | `/api/citas/filtrar` | Filtrar citas por criterios |
| GET | `/api/citas/medico/agenda` | Ver agenda del médico |
| POST | `/api/citas` | Crear nueva cita |
| PATCH | `/api/citas/:id` | Actualizar cita |
| PATCH | `/api/citas/:id/estado` | Cambiar estado de la cita |
| PATCH | `/api/citas/:id/atendida` | Marcar cita como atendida (Médico) |
| DELETE | `/api/citas/:id` | Cancelar cita |

### Disponibilidad

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/disponibilidad/medico/:medicoId/fecha/:fecha` | Consultar disponibilidad |
| POST | `/api/disponibilidad` | Configurar disponibilidad (Médico) |
| POST | `/api/disponibilidad/bloquear` | Bloquear horarios (Médico) |
| DELETE | `/api/disponibilidad/medico/:medicoId/fecha/:fecha` | Cerrar agenda (Médico) |

### Reportes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reportes/citas` | Generar reporte de citas (JSON) |
| GET | `/api/reportes/citas/csv` | Generar reporte de citas (CSV) |
| GET | `/api/reportes/estadisticas` | Generar estadísticas |
| GET | `/api/reportes/mis-citas` | Reporte de citas del médico actual |

### Admisión

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admision/agenda-diaria` | Ver agenda del día |
| GET | `/api/admision` | Listar personal de admisión |
| POST | `/api/admision` | Crear personal de admisión |
| PATCH | `/api/citas/:id/en-espera` | Marcar llegada de paciente |

### Monitoreo

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Verificar estado del servicio |

## Tests

El proyecto incluye pruebas unitarias, de integración y end-to-end.

### Ejecución de Tests

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas unitarias
npm run test:unit

# Ejecutar pruebas de integración
npm run test:integration

# Ejecutar pruebas end-to-end
npm run test:e2e

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar pruebas de API con Newman
npm run api:test
```

### Reportes de Pruebas

Las pruebas generan reportes detallados disponibles en la carpeta reports.

También se puede generar un informe Allure:

```bash
# Generar reporte Allure
npm run test:allure
npm run allure:report

# Visualizar reporte Allure
npm run allure:serve
```

## CI/CD

El proyecto utiliza GitHub Actions para integración y entrega continuas.

### Flujo de CI

El pipeline de CI se ejecuta automáticamente en cada push o pull request:

1. **Instalación de dependencias**
2. **Lint**: Verifica estilo de código
3. **Tests unitarios**: Valida componentes individuales
4. **Tests de integración**: Valida interacción entre componentes
5. **Tests API**: Valida endpoints con Newman
6. **Generación de reportes**: Crea informes de pruebas

### Flujo de CD

El pipeline de CD se ejecuta automáticamente en cada push a `main` o creación de tags:

1. **Build de Docker**: Construye la imagen de contenedor
2. **Publicación en DockerHub**: Publica la imagen con diferentes tags

### Configuración

Los workflows están definidos en los archivos:

- ci.yml
- cd.yml

Para configurar el CD, es necesario agregar los siguientes secrets en GitHub:

- `DOCKERHUB_USERNAME`: Nombre de usuario de DockerHub
- `DOCKERHUB_TOKEN`: Token de acceso de DockerHub

## Despliegue con Docker

### Imagen Docker

```bash
# Construir imagen localmente
docker build -t healthleap-monolith .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env healthleap-monolith
```

### Docker Compose

El archivo docker-compose.yml incluye la aplicación y una instancia de Redis:

```bash
# Iniciar todos los servicios
docker compose up -d

# Detener servicios
docker compose down

# Ver logs
docker compose logs -f app
```

### Uso de la imagen de DockerHub

```bash
# Descargar la imagen
docker pull usuario/healthleap-monolith:latest

# Ejecutar
docker run -p 3000:3000 -e DB_HOST=host.docker.internal -e DB_USER=usuario -e DB_PASS=password -e DB_NAME=healthleap usuario/healthleap-monolith:latest
```



Desarrollado con ❤️ por andresazcona
