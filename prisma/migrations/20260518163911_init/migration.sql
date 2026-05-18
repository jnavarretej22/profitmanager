-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'coach', 'alumno');

-- CreateEnum
CREATE TYPE "PlanActual" AS ENUM ('gratis', 'inicial', 'medio', 'medio_plus', 'ilimitado');

-- CreateEnum
CREATE TYPE "Periodicidad" AS ENUM ('mensual', 'anual');

-- CreateEnum
CREATE TYPE "EstadoPlan" AS ENUM ('activo', 'vencido', 'solo_lectura');

-- CreateEnum
CREATE TYPE "Objetivo" AS ENUM ('hipertrofia', 'perdida_grasa', 'fuerza', 'resistencia', 'general');

-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('M', 'F', 'otro');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('online', 'presencial');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('agendada', 'completada', 'cancelada');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('transferencia', 'deposito', 'otro');

-- CreateEnum
CREATE TYPE "MomentoDia" AS ENUM ('desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('vencimiento', 'plan_activado', 'nueva_rutina', 'nuevo_plan_alimenticio', 'cita_agendada', 'cita_cancelada', 'medicion_registrada', 'alumno_archivado', 'pago_registrado', 'bienvenida');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(30),
    "pais" CHAR(2),
    "zona_horaria" VARCHAR(60),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_login" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_actual" "PlanActual" NOT NULL DEFAULT 'gratis',
    "periodicidad" "Periodicidad",
    "fecha_inicio_plan" DATE,
    "fecha_vencimiento" DATE,
    "estado_plan" "EstadoPlan" NOT NULL DEFAULT 'activo',
    "logo_url" TEXT,
    "google_calendar_token" TEXT,
    "bio" TEXT,
    "especialidad" VARCHAR(150),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumnos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "identificacion" VARCHAR(30),
    "fecha_nacimiento" DATE,
    "genero" "Genero",
    "altura_cm" SMALLINT,
    "peso_inicial_kg" DECIMAL(5,2),
    "objetivo" "Objetivo",
    "fecha_inicio" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas_medicas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "alumnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutinas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID NOT NULL,
    "alumno_id" UUID,
    "es_template" BOOLEAN NOT NULL DEFAULT false,
    "es_template_sistema" BOOLEAN NOT NULL DEFAULT false,
    "plan_requerido" "PlanActual",
    "objetivo" "Objetivo",
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "duracion_minutos" SMALLINT,
    "dias_semana" JSONB,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "rutinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejercicios_rutina" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rutina_id" UUID NOT NULL,
    "orden" SMALLINT NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "series" SMALLINT,
    "repeticiones" VARCHAR(20),
    "descanso_segundos" SMALLINT,
    "rpe" VARCHAR(10),
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ejercicios_rutina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_alimenticios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID NOT NULL,
    "alumno_id" UUID,
    "es_template" BOOLEAN NOT NULL DEFAULT false,
    "es_template_sistema" BOOLEAN NOT NULL DEFAULT false,
    "plan_requerido" "PlanActual",
    "objetivo" "Objetivo",
    "nombre" VARCHAR(200) NOT NULL,
    "calorias_objetivo" SMALLINT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "planes_alimenticios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comidas_plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "momento" "MomentoDia" NOT NULL,
    "hora_sugerida" TIME,
    "descripcion" TEXT NOT NULL,
    "calorias" SMALLINT,
    "proteinas_g" SMALLINT,
    "carbohidratos_g" SMALLINT,
    "grasas_g" SMALLINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "comidas_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mediciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alumno_id" UUID NOT NULL,
    "registrado_por" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "peso_kg" DECIMAL(5,2),
    "cintura_cm" DECIMAL(5,2),
    "cadera_cm" DECIMAL(5,2),
    "pecho_cm" DECIMAL(5,2),
    "brazo_cm" DECIMAL(5,2),
    "pierna_cm" DECIMAL(5,2),
    "porcentaje_grasa" DECIMAL(4,2),
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "mediciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID NOT NULL,
    "alumno_id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "fecha_inicio" TIMESTAMPTZ NOT NULL,
    "fecha_fin" TIMESTAMPTZ NOT NULL,
    "modalidad" "Modalidad" NOT NULL,
    "ubicacion" VARCHAR(300),
    "meet_link" TEXT,
    "google_event_id" VARCHAR(200),
    "estado" "EstadoCita" NOT NULL DEFAULT 'agendada',
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL DEFAULT 'USD',
    "metodo" "MetodoPago" NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "periodo_desde" DATE NOT NULL,
    "periodo_hasta" DATE NOT NULL,
    "comprobante_url" TEXT,
    "registrado_por" UUID NOT NULL,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_planes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID NOT NULL,
    "plan_anterior" VARCHAR(50) NOT NULL,
    "plan_nuevo" VARCHAR(50) NOT NULL,
    "estado_anterior" VARCHAR(50) NOT NULL,
    "estado_nuevo" VARCHAR(50) NOT NULL,
    "fecha_vencimiento_anterior" DATE,
    "fecha_vencimiento_nueva" DATE,
    "cambiado_por" UUID NOT NULL,
    "motivo" TEXT,
    "pago_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "link" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_verificacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "expira_en" TIMESTAMPTZ NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_user_id_key" ON "coaches"("user_id");

-- CreateIndex
CREATE INDEX "coaches_estado_plan_idx" ON "coaches"("estado_plan");

-- CreateIndex
CREATE INDEX "coaches_fecha_vencimiento_idx" ON "coaches"("fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_user_id_key" ON "alumnos"("user_id");

-- CreateIndex
CREATE INDEX "alumnos_coach_id_idx" ON "alumnos"("coach_id");

-- CreateIndex
CREATE INDEX "alumnos_coach_id_activo_idx" ON "alumnos"("coach_id", "activo");

-- CreateIndex
CREATE INDEX "rutinas_coach_id_idx" ON "rutinas"("coach_id");

-- CreateIndex
CREATE INDEX "rutinas_alumno_id_idx" ON "rutinas"("alumno_id");

-- CreateIndex
CREATE INDEX "rutinas_es_template_sistema_objetivo_idx" ON "rutinas"("es_template_sistema", "objetivo");

-- CreateIndex
CREATE INDEX "ejercicios_rutina_rutina_id_idx" ON "ejercicios_rutina"("rutina_id");

-- CreateIndex
CREATE UNIQUE INDEX "ejercicios_rutina_rutina_id_orden_key" ON "ejercicios_rutina"("rutina_id", "orden");

-- CreateIndex
CREATE INDEX "planes_alimenticios_coach_id_idx" ON "planes_alimenticios"("coach_id");

-- CreateIndex
CREATE INDEX "planes_alimenticios_alumno_id_idx" ON "planes_alimenticios"("alumno_id");

-- CreateIndex
CREATE INDEX "planes_alimenticios_es_template_sistema_objetivo_idx" ON "planes_alimenticios"("es_template_sistema", "objetivo");

-- CreateIndex
CREATE INDEX "comidas_plan_plan_id_idx" ON "comidas_plan"("plan_id");

-- CreateIndex
CREATE INDEX "mediciones_alumno_id_fecha_idx" ON "mediciones"("alumno_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "citas_coach_id_fecha_inicio_idx" ON "citas"("coach_id", "fecha_inicio");

-- CreateIndex
CREATE INDEX "citas_alumno_id_idx" ON "citas"("alumno_id");

-- CreateIndex
CREATE INDEX "pagos_coach_id_fecha_pago_idx" ON "pagos"("coach_id", "fecha_pago" DESC);

-- CreateIndex
CREATE INDEX "historial_planes_coach_id_created_at_idx" ON "historial_planes"("coach_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notificaciones_user_id_leida_idx" ON "notificaciones"("user_id", "leida");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_verificacion_token_key" ON "tokens_verificacion"("token");

-- CreateIndex
CREATE INDEX "tokens_verificacion_user_id_idx" ON "tokens_verificacion"("user_id");

-- CreateIndex
CREATE INDEX "tokens_verificacion_expira_en_idx" ON "tokens_verificacion"("expira_en");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnos" ADD CONSTRAINT "alumnos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnos" ADD CONSTRAINT "alumnos_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejercicios_rutina" ADD CONSTRAINT "ejercicios_rutina_rutina_id_fkey" FOREIGN KEY ("rutina_id") REFERENCES "rutinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_alimenticios" ADD CONSTRAINT "planes_alimenticios_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_alimenticios" ADD CONSTRAINT "planes_alimenticios_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comidas_plan" ADD CONSTRAINT "comidas_plan_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes_alimenticios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mediciones" ADD CONSTRAINT "mediciones_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_planes" ADD CONSTRAINT "historial_planes_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_planes" ADD CONSTRAINT "historial_planes_cambiado_por_fkey" FOREIGN KEY ("cambiado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_planes" ADD CONSTRAINT "historial_planes_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pagos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_verificacion" ADD CONSTRAINT "tokens_verificacion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
