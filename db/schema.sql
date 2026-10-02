-- Esquema de HealthLeap. Idempotente: se puede correr varias veces.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  rol           VARCHAR(20)  NOT NULL CHECK (rol IN ('paciente', 'medico', 'admisión', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medicos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  especialidad  VARCHAR(100) NOT NULL,
  centro_id     VARCHAR(50)  NOT NULL,
  duracion_cita INTEGER NOT NULL DEFAULT 30
);

CREATE TABLE IF NOT EXISTS admisiones (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  area       VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS citas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  medico_id   UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  fecha_hora  TIMESTAMPTZ NOT NULL,
  estado      VARCHAR(20) NOT NULL DEFAULT 'agendada'
              CHECK (estado IN ('agendada', 'en espera', 'atendida', 'cancelada')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bloques_bloqueados (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medico_id   UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  fecha       DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citas_medico_fecha ON citas (medico_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas (paciente_id);
