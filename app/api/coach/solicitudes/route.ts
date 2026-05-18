import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/coach/solicitudes?estado=pendiente
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const estado = req.nextUrl.searchParams.get("estado") ?? undefined

  const where: Record<string, unknown> = { coach_id: session.user.coachId ?? "" }
  if (estado && ["pendiente", "aprobada", "rechazada"].includes(estado)) {
    where.estado = estado
  }

  const solicitudes = await prisma.solicitudInscripcion.findMany({
    where,
    orderBy: { created_at: "desc" },
    select: {
      id:           true,
      nombre:       true,
      email:        true,
      telefono:     true,
      mensaje:      true,
      estado:       true,
      nota_interna: true,
      created_at:   true,
      alumno_id:    true,
    },
  })

  // Contador de pendientes para el badge
  const pendientes = await prisma.solicitudInscripcion.count({
    where: { coach_id: session.user.coachId ?? "", estado: "pendiente" },
  })

  return NextResponse.json({ solicitudes, pendientes })
}
