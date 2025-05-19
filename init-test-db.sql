-- scripts/init-test-db.sql
CREATE DATABASE IF NOT EXISTS healthleap_test;

\c healthleap_test;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de médicos
CREATE TABLE IF NOT EXISTS medicos (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) REFERENCES usuarios(id),
  especialidad VARCHAR(100) NOT NULL,
  horario_inicio TIME,
  horario_fin TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS citas (
  id VARCHAR(36) PRIMARY KEY,
  paciente_id VARCHAR(36) REFERENCES usuarios(id),
  medico_id VARCHAR(36) REFERENCES medicos(id),
  fecha_hora TIMESTAMP NOT NULL,
  estado VARCHAR(20) NOT NULL,
  motivo TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);