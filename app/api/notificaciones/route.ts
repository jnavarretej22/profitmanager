import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/notificaciones — listar notificaciones del usuario
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })

  const notificaciones = await prisma.notificacion.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" },
    take: 50,
  })

  return NextResponse.json({ notificaciones })
}

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).optional(), // null/omitido = todas
})

// PATCH /api/notificaciones — marcar como leídas (1 o todas)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  const ids = parsed.success ? parsed.data.ids : undefined

  await prisma.notificacion.updateMany({
    where: {
      user_id: session.user.id,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { leida: true },
  })

  return NextResponse.json({ ok: true })
}
