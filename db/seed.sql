-- Datos de demo. Todas las cuentas usan la contraseña: Demo1234!
-- Idempotente: se puede correr varias veces. Las citas se crean relativas a la fecha actual.

INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Admin Demo',        'admin@example.com',     '$2b$10$BBfTx0Yhe.Zn56e5PN9QqePIz5XLs6iL9TllnXctBL7LwKDBXkMRe', 'admin'),
  ('a0000000-0000-4000-8000-000000000002', 'Laura Recepción',   'admision@example.com',  '$2b$10$BBfTx0Yhe.Zn56e5PN9QqePIz5XLs6iL9TllnXctBL7LwKDBXkMRe', 'admisión'),
  ('a0000000-0000-4000-8000-000000000011', 'Dra. Ana Ruiz',     'ana.ruiz@example.com',  '$2b$10$BBfTx0Yhe.Zn56e5PN9QqePIz5XLs6iL9TllnXctBL7LwKDBXkMRe', 'medico'),
  ('a0000000-0000-4000-8000-000000000012', 'Dr. Carlos Méndez', 'carlos.mendez@example.com', '$2b$10$BBfTx0Yhe.Zn56e5PN9QqePIz5XLs6iL9TllnXctBL7LwKDBXkMRe', 'medico'),
  ('a0000000-0000-4000-8000-000000000013', 'Dra. Sofía Torres', 'sofia.torres@example.com', '$2b$10$BBfTx0Yhe.Zn56e5PN9QqePIz5XLs6iL9TllnXctBL7LwKDBXkMRe', 'medico'),
  ('a0000000-0000-4000-8000-000000000021', 'Pedro Gómez',       'paciente@example.com',  '$2b$10$BBfTx0Yhe.Zn56e5PN9QqePIz5XLs6iL9TllnXctBL7LwKDBXkMRe', 'paciente'),
  ('a0000000-0000-4000-8000-000000000022', 'María López',       'maria.lopez@example.com', '$2b$10$BBfTx0Yhe.Zn56e5PN9QqePIz5XLs6iL9TllnXctBL7LwKDBXkMRe', 'paciente')
ON CONFLICT (email) DO NOTHING;

INSERT INTO admisiones (usuario_id, area) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'Recepción principal')
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO medicos (id, usuario_id, especialidad, centro_id, duracion_cita) VALUES
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000011', 'Cardiología', 'c0000000-0000-4000-8000-000000000001', 30),
  ('b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000012', 'Pediatría',   'c0000000-0000-4000-8000-000000000001', 20),
  ('b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000013', 'Dermatología', 'c0000000-0000-4000-8000-000000000001', 30)
ON CONFLICT (usuario_id) DO NOTHING;

-- Citas de ejemplo, solo si aún no hay ninguna
INSERT INTO citas (paciente_id, medico_id, fecha_hora, estado)
SELECT * FROM (VALUES
  ('a0000000-0000-4000-8000-000000000021'::uuid, 'b0000000-0000-4000-8000-000000000011'::uuid, date_trunc('day', now()) + interval '1 day 14 hours',            'agendada'),
  ('a0000000-0000-4000-8000-000000000022'::uuid, 'b0000000-0000-4000-8000-000000000011'::uuid, date_trunc('day', now()) + interval '1 day 15 hours',            'agendada'),
  ('a0000000-0000-4000-8000-000000000021'::uuid, 'b0000000-0000-4000-8000-000000000012'::uuid, date_trunc('day', now()) + interval '2 days 16 hours',           'agendada'),
  ('a0000000-0000-4000-8000-000000000022'::uuid, 'b0000000-0000-4000-8000-000000000013'::uuid, date_trunc('day', now()) + interval '3 days 13 hours 30 minutes','agendada'),
  ('a0000000-0000-4000-8000-000000000021'::uuid, 'b0000000-0000-4000-8000-000000000013'::uuid, date_trunc('day', now()) - interval '7 days' + interval '14 hours', 'atendida'),
  ('a0000000-0000-4000-8000-000000000022'::uuid, 'b0000000-0000-4000-8000-000000000012'::uuid, date_trunc('day', now()) - interval '3 days' + interval '15 hours', 'cancelada')
) AS v(paciente_id, medico_id, fecha_hora, estado)
WHERE NOT EXISTS (SELECT 1 FROM citas);
