-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('completada', 'parcial', 'no_realizada');

-- AlterTable
ALTER TABLE "comidas_plan" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "dias_plan" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "dias_rutina" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "solicitudes_inscripcion" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "sesiones_rutina_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alumno_id" UUID NOT NULL,
    "dia_rutina_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "estado" "EstadoSesion" NOT NULL DEFAULT 'completada',
    "energia" SMALLINT,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sesiones_rutina_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comidas_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alumno_id" UUID NOT NULL,
    "comida_plan_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "cumplida" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "comidas_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sesiones_rutina_log_alumno_id_fecha_idx" ON "sesiones_rutina_log"("alumno_id", "fecha" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_rutina_log_alumno_id_dia_rutina_id_fecha_key" ON "sesiones_rutina_log"("alumno_id", "dia_rutina_id", "fecha");

-- CreateIndex
CREATE INDEX "comidas_log_alumno_id_fecha_idx" ON "comidas_log"("alumno_id", "fecha" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "comidas_log_alumno_id_comida_plan_id_fecha_key" ON "comidas_log"("alumno_id", "comida_plan_id", "fecha");

-- AddForeignKey
ALTER TABLE "sesiones_rutina_log" ADD CONSTRAINT "sesiones_rutina_log_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_rutina_log" ADD CONSTRAINT "sesiones_rutina_log_dia_rutina_id_fkey" FOREIGN KEY ("dia_rutina_id") REFERENCES "dias_rutina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comidas_log" ADD CONSTRAINT "comidas_log_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comidas_log" ADD CONSTRAINT "comidas_log_comida_plan_id_fkey" FOREIGN KEY ("comida_plan_id") REFERENCES "comidas_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
