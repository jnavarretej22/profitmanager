import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generarUrlAutorizacion } from "@/lib/google-calendar"

// GET /api/google/connect — redirige a Google OAuth (solo plan Inicial)
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId },
    select: { plan_actual: true },
  })

  if (!coach || coach.plan_actual !== "inicial") {
    return NextResponse.json(
      { error: "FEATURE_NOT_AVAILABLE", mensaje: "Google Calendar solo está disponible en el Plan Inicial" },
      { status: 403 }
    )
  }

  const url = generarUrlAutorizacion()
  return NextResponse.redirect(url)
}
