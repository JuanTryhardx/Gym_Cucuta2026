-- ============================================================
-- MIGRACIÓN: Sistema de solicitudes de entrenadores
-- App Gym Cúcuta
-- ============================================================
-- IMPACTO: Solo AÑADE una tabla nueva.
--          No modifica ni elimina NADA existente.
-- ============================================================

-- 1. CREAR tabla solicitudes_entrenador
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.solicitudes_entrenador (
  id                 bigserial PRIMARY KEY,
  nombre             text        NOT NULL,
  documento          text        NOT NULL,
  email              text        NULL,
  telefono           text        NULL,
  nacimiento         date        NULL,
  genero             text        NULL,
  especialidad       text        NOT NULL,
  motivacion         text        NULL,
  estado             text        NOT NULL DEFAULT 'pendiente',
  --  valores permitidos: 'pendiente' | 'aprobado' | 'rechazado'
  fecha_solicitud    timestamptz NOT NULL DEFAULT now(),
  fecha_resolucion   timestamptz NULL
);

-- 2. RESTRICCIÓN de integridad para estado (opcional pero recomendada)
-- ---------------------------------------------------------------
ALTER TABLE public.solicitudes_entrenador
  ADD CONSTRAINT chk_estado_solicitud
  CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'));

-- 3. ÍNDICE para consultas frecuentes (pendientes + documento)
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado
  ON public.solicitudes_entrenador (estado);

CREATE INDEX IF NOT EXISTS idx_solicitudes_documento
  ON public.solicitudes_entrenador (documento);

-- 4. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------
-- Habilitar RLS en la tabla nueva
ALTER TABLE public.solicitudes_entrenador ENABLE ROW LEVEL SECURITY;

-- Política de INSERCIÓN: cualquier usuario anónimo puede enviar solicitudes
-- (el formulario de registro es público — usa la anon key)
CREATE POLICY "Insertar solicitud pública"
  ON public.solicitudes_entrenador
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política de LECTURA: solo el rol authenticated (admin) puede leer
CREATE POLICY "Leer solicitudes solo admin"
  ON public.solicitudes_entrenador
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de ACTUALIZACIÓN: solo authenticated puede aprobar/rechazar
CREATE POLICY "Actualizar solicitudes solo admin"
  ON public.solicitudes_entrenador
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- VERIFICACIÓN: tablas existentes — sin cambios
-- ============================================================
-- personas              ← sin cambios
-- entrenadores          ← sin cambios (aprobar crea una fila aquí)
-- pagos                 ← sin cambios
-- planes                ← sin cambios
-- eventos               ← sin cambios
-- noticias              ← sin cambios
-- tickets               ← sin cambios
-- solicitudes_entrenador ← NUEVA ✅
-- ============================================================
