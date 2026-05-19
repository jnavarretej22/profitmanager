import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// DELETE /api/admin/rutinas/[id] — elimina una rutina template del sistema
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const rutina = await prisma.rutina.findUnique({
    where: { id },
    select: { id: true, es_template: true, alumno_id: true },
  })

  if (!rutina) {
    return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  }

  if (!rutina.es_template || rutina.alumno_id) {
    return NextResponse.json({ error: "SOLO_TEMPLATES_SISTEMA", mensaje: "Solo se pueden eliminar templates del sistema" }, { status: 400 })
  }

  await prisma.rutina.update({
    where: { id },
    data: { deleted_at: new Date(), activa: false },
  })

  return NextResponse.json({ ok: true })
}
