import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getAlumnoAutenticado } from "@/lib/alumno-guard"
import { errorResponse } from "@/lib/plan-guard"

const upsertSchema = z.object({
  comida_plan_id: z.string().uuid(),
  fecha:          z.string().date(),
  cumplida:       z.boolean(),
  notas:          z.string().max(500).optional().nullable(),
})

// POST /api/alumno/comidas-log — upsert log de comida
export async function POST(req: NextRequest) {
  const { alumno, error } = await getAlumnoAutenticado()
  if (error) return error

  const body   = await req.json()
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const { comida_plan_id, fecha, cumplida, notas } = parsed.data

  // Verificar que la comida pertenezca a un plan asignado al alumno
  const comida = await prisma.comidaPlan.findFirst({
    where: {
      id:  comida_plan_id,
      dia: { plan: { alumno_id: alumno!.id, deleted_at: null } },
    },
    select: { id: true },
  })
  if (!comida) return errorResponse("NO_ENCONTRADO", "Comida no encontrada", 404)

  const fechaDate = new Date(fecha + "T12:00:00")

  const log = await prisma.comidaLog.upsert({
    where: {
      alumno_id_comida_plan_id_fecha: {
        alumno_id:      alumno!.id,
        comida_plan_id,
        fecha:          fechaDate,
      },
    },
    create: {
      alumno_id:      alumno!.id,
      comida_plan_id,
      fecha:          fechaDate,
      cumplida,
      notas:          notas ?? null,
    },
    update: {
      cumplida,
      notas: notas ?? null,
    },
  })

  return NextResponse.json({ ok: true, log })
}

// DELETE /api/alumno/comidas-log?comida_plan_id=...&fecha=YYYY-MM-DD
export async function DELETE(req: NextRequest) {
  const { alumno, error } = await getAlumnoAutenticado()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const comida_plan_id   = searchParams.get("comida_plan_id")
  const fecha            = searchParams.get("fecha")

  if (!comida_plan_id || !fecha) {
    return errorResponse("DATOS_INVALIDOS", "Faltan parámetros", 400)
  }

  await prisma.comidaLog.deleteMany({
    where: {
      alumno_id:      alumno!.id,
      comida_plan_id,
      fecha:          new Date(fecha + "T12:00:00"),
    },
  })

  return NextResponse.json({ ok: true })
}
