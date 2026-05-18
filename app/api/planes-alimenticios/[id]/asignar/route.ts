import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, errorResponse } from "@/lib/plan-guard"

const asignarSchema = z.object({ alumno_id: z.string().uuid() })

// POST /api/planes-alimenticios/[id]/asignar
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const plan = await prisma.planAlimenticio.findFirst({
    where: { id, coach_id: coach!.id, deleted_at: null },
  })
  if (!plan) return errorResponse("NO_ENCONTRADO", "Plan no encontrado", 404)

  const body = await req.json()
  const parsed = asignarSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "alumno_id requerido", 400)

  const { alumno_id } = parsed.data

  const alumno = await prisma.alumno.findFirst({
    where: { id: alumno_id, coach_id: coach!.id, deleted_at: null },
  })
  if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

  await prisma.planAlimenticio.updateMany({
    where: { alumno_id, activo: true, deleted_at: null },
    data: { activo: false },
  })

  const planAsignado = await prisma.planAlimenticio.update({
    where: { id },
    data: { alumno_id, activo: true, es_template: false },
  })

  return NextResponse.json({ ok: true, plan: planAsignado })
}
