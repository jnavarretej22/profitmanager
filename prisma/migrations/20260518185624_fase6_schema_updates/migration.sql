-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoNotificacion" ADD VALUE 'vencimiento_proximo';
ALTER TYPE "TipoNotificacion" ADD VALUE 'pago_confirmado';

-- DropForeignKey
ALTER TABLE "historial_planes" DROP CONSTRAINT "historial_planes_cambiado_por_fkey";

-- AlterTable
ALTER TABLE "historial_planes" ALTER COLUMN "cambiado_por" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "historial_planes" ADD CONSTRAINT "historial_planes_cambiado_por_fkey" FOREIGN KEY ("cambiado_por") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
