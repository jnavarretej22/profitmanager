-- CreateEnum: estados solicitud e inscripción
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- AlterEnum: agregar tipos de notificación
ALTER TYPE "TipoNotificacion" ADD VALUE 'nueva_solicitud';
ALTER TYPE "TipoNotificacion" ADD VALUE 'solicitud_aprobada';
ALTER TYPE "TipoNotificacion" ADD VALUE 'solicitud_rechazada';

-- CreateTable: solicitudes_inscripcion
CREATE TABLE "solicitudes_inscripcion" (
    "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id"     UUID NOT NULL,
    "nombre"       VARCHAR(150) NOT NULL,
    "email"        VARCHAR(255) NOT NULL,
    "telefono"     VARCHAR(30),
    "mensaje"      VARCHAR(300),
    "estado"       "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "nota_interna" VARCHAR(500),
    "alumno_id"    UUID,
    "ip_origen"    VARCHAR(45),
    "created_at"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_inscripcion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "solicitudes_inscripcion"
    ADD CONSTRAINT "solicitudes_inscripcion_coach_id_fkey"
    FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_inscripcion"
    ADD CONSTRAINT "solicitudes_inscripcion_alumno_id_fkey"
    FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "solicitudes_inscripcion_coach_id_estado_idx" ON "solicitudes_inscripcion"("coach_id", "estado");
CREATE INDEX "solicitudes_inscripcion_email_coach_id_idx"  ON "solicitudes_inscripcion"("email", "coach_id");
