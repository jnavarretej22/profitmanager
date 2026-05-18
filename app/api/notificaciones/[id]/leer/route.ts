import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// PATCH /api/notificaciones/[id]/leer — marcar una notificación como leída
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })

  const notificacion = await prisma.notificacion.findFirst({
    where: { id, user_id: session.user.id },
  })
  if (!notificacion) return NextResponse.json({ error: "NO_ENCONTRADA" }, { status: 404 })

  await prisma.notificacion.update({
    where: { id },
    data: { leida: true },
  })

  return NextResponse.json({ ok: true })
}
