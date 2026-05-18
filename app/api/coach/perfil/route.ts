import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const perfilSchema = z.object({
  telefono:     z.string().optional(),
  zona_horaria: z.string().optional(),
  pais:         z.string().length(2).optional(),
  bio:          z.string().optional(),
  especialidad: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = perfilSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "DATOS_INVALIDOS" }, { status: 400 })

  const { telefono, zona_horaria, pais, bio, especialidad } = parsed.data

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(telefono     !== undefined && { telefono }),
        ...(zona_horaria !== undefined && { zona_horaria }),
        ...(pais         !== undefined && { pais }),
      },
    }),
    prisma.coach.update({
      where: { id: session.user.coachId },
      data: {
        ...(bio          !== undefined && { bio }),
        ...(especialidad !== undefined && { especialidad }),
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
