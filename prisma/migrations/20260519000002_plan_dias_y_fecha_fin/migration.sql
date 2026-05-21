-- Plan alimenticio: estructura por días (DiaPlan → ComidaPlan) + fecha_fin

-- Añadir fecha_fin a planes_alimenticios
ALTER TABLE "planes_alimenticios" ADD COLUMN "fecha_fin" DATE;

-- Eliminar tabla comidas_plan antigua (datos de desarrollo)
DROP TABLE IF EXISTS "comidas_plan";

-- Crear tabla dias_plan
CREATE TABLE "dias_plan" (
  "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
  "plan_id"      UUID         NOT NULL,
  "dia_semana"   "DiaSemana"  NOT NULL,
  "nombre_foco"  VARCHAR(100),
  "es_libre"     BOOLEAN      NOT NULL DEFAULT false,
  "orden"        SMALLINT     NOT NULL,
  "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dias_plan_pkey" PRIMARY KEY ("id")
);

-- Crear nueva tabla comidas_plan con FK a dias_plan
CREATE TABLE "comidas_plan" (
  "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
  "dia_plan_id"     UUID         NOT NULL,
  "orden"           SMALLINT     NOT NULL,
  "momento"         "MomentoDia" NOT NULL,
  "hora_sugerida"   TIME,
  "descripcion"     TEXT         NOT NULL,
  "calorias"        SMALLINT,
  "proteinas_g"     SMALLINT,
  "carbohidratos_g" SMALLINT,
  "grasas_g"        SMALLINT,
  "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comidas_plan_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "dias_plan" ADD CONSTRAINT "dias_plan_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "planes_alimenticios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comidas_plan" ADD CONSTRAINT "comidas_plan_dia_plan_id_fkey"
  FOREIGN KEY ("dia_plan_id") REFERENCES "dias_plan"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Índices
CREATE INDEX "dias_plan_plan_id_idx" ON "dias_plan"("plan_id");
CREATE UNIQUE INDEX "dias_plan_plan_id_dia_semana_key" ON "dias_plan"("plan_id", "dia_semana");
CREATE INDEX "comidas_plan_dia_plan_id_idx" ON "comidas_plan"("dia_plan_id");
