-- AlterTable: Perfil público del coach (Plan Inicial)
ALTER TABLE "coaches"
  ADD COLUMN "slug"                  VARCHAR(80),
  ADD COLUMN "perfil_publico_activo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "foto_publica_url"      TEXT,
  ADD COLUMN "titulo_profesional"    VARCHAR(200),
  ADD COLUMN "especialidades_tags"   JSONB,
  ADD COLUMN "anios_experiencia"     SMALLINT,
  ADD COLUMN "ciudad"                VARCHAR(100),
  ADD COLUMN "instagram_url"         VARCHAR(200),
  ADD COLUMN "cta_whatsapp_texto"    VARCHAR(100);

-- CreateIndex: slug único
CREATE UNIQUE INDEX "coaches_slug_key" ON "coaches"("slug");
