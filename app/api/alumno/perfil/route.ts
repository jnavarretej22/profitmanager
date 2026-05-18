import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const perfilSchema = z.object({
  telefono: z.string().optional(),
  zona_horaria: z.string().optional(),
})

// PATCH /api/alumno/perfil — editar teléfono y zona horaria (solo el alumno)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "alumno") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = perfilSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "DATOS_INVALIDOS" }, { status: 400 })
  }

  const { telefono, zona_horaria } = parsed.data

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(telefono !== undefined && { telefono }),
      ...(zona_horaria && { zona_horaria }),
    },
  })

  return NextResponse.json({ ok: true })
}
