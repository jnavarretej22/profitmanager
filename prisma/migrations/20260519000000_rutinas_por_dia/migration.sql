-- Migration: rutinas_por_dia
-- Convierte el modelo de rutinas de lista plana de ejercicios a estructura por día.
-- Estrategia de migración (opción A): todos los ejercicios existentes van al primer
-- día activo de cada rutina (o "lunes" como fallback).

-- ── 1. Nuevo enum DiaSemana ─────────────────────────────────────────────────
CREATE TYPE "DiaSemana" AS ENUM (
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
);

-- ── 2. Crear tabla dias_rutina ───────────────────────────────────────────────
CREATE TABLE "dias_rutina" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "rutina_id"   UUID        NOT NULL,
  "dia_semana"  "DiaSemana" NOT NULL,
  "nombre_foco" VARCHAR(100),
  "orden"       SMALLINT    NOT NULL,
  "es_descanso" BOOLEAN     NOT NULL DEFAULT false,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dias_rutina_pkey" PRIMARY KEY ("id")
);

-- ── 3. Migración de datos ────────────────────────────────────────────────────
-- Para cada rutina que tenga ejercicios, crear un DiaRutina con el primer día
-- del array dias_semana (o "lunes" si el array está vacío o es null).

INSERT INTO "dias_rutina" ("rutina_id", "dia_semana", "orden", "updated_at")
SELECT
  r.id                                              AS rutina_id,
  COALESCE(
    CASE
      WHEN r.dias_semana IS NOT NULL
        AND jsonb_array_length(r.dias_semana::jsonb) > 0
      THEN (r.dias_semana::jsonb ->> 0)::"DiaSemana"
      ELSE 'lunes'::"DiaSemana"
    END,
    'lunes'::"DiaSemana"
  )                                                 AS dia_semana,
  1                                                 AS orden,
  NOW()                                             AS updated_at
FROM "rutinas" r
WHERE EXISTS (
  SELECT 1 FROM "ejercicios_rutina" e WHERE e.rutina_id = r.id
);

-- ── 4. Agregar columna dia_rutina_id (nullable por ahora) ────────────────────
ALTER TABLE "ejercicios_rutina" ADD COLUMN "dia_rutina_id" UUID;

-- ── 5. Poblar dia_rutina_id desde los DiaRutina recién creados ───────────────
UPDATE "ejercicios_rutina" e
SET    "dia_rutina_id" = dr.id
FROM   "dias_rutina" dr
WHERE  e.rutina_id = dr.rutina_id;

-- ── 6. Eliminar ejercicios huérfanos (rutinas sin DiaRutina = sin datos migrados) ──
DELETE FROM "ejercicios_rutina" WHERE "dia_rutina_id" IS NULL;

-- ── 7. Hacer dia_rutina_id NOT NULL ─────────────────────────────────────────
ALTER TABLE "ejercicios_rutina" ALTER COLUMN "dia_rutina_id" SET NOT NULL;

-- ── 8. Quitar FK y columna rutina_id de ejercicios_rutina ───────────────────
ALTER TABLE "ejercicios_rutina" DROP CONSTRAINT IF EXISTS "ejercicios_rutina_rutina_id_fkey";
DROP INDEX  IF EXISTS "ejercicios_rutina_rutina_id_idx";
DROP INDEX  IF EXISTS "ejercicios_rutina_rutina_id_orden_key";
ALTER TABLE "ejercicios_rutina" DROP COLUMN "rutina_id";

-- ── 9. Eliminar dias_semana de rutinas ──────────────────────────────────────
ALTER TABLE "rutinas" DROP COLUMN IF EXISTS "dias_semana";

-- ── 10. Agregar FK, índices y restricciones finales ─────────────────────────
ALTER TABLE "dias_rutina"
  ADD CONSTRAINT "dias_rutina_rutina_id_fkey"
  FOREIGN KEY ("rutina_id") REFERENCES "rutinas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "dias_rutina_rutina_id_dia_semana_key"
  ON "dias_rutina"("rutina_id", "dia_semana");

CREATE INDEX "dias_rutina_rutina_id_idx"
  ON "dias_rutina"("rutina_id");

ALTER TABLE "ejercicios_rutina"
  ADD CONSTRAINT "ejercicios_rutina_dia_rutina_id_fkey"
  FOREIGN KEY ("dia_rutina_id") REFERENCES "dias_rutina"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ejercicios_rutina_dia_rutina_id_orden_key"
  ON "ejercicios_rutina"("dia_rutina_id", "orden");

CREATE INDEX "ejercicios_rutina_dia_rutina_id_idx"
  ON "ejercicios_rutina"("dia_rutina_id");
