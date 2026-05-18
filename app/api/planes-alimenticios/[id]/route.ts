import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, errorResponse } from "@/lib/plan-guard"
import type { Objetivo, MomentoDia } from "@prisma/client"

const editarPlanSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  objetivo: z.enum(["hipertrofia", "perdida_grasa", "fuerza", "resistencia", "general"]).optional(),
  calorias_objetivo: z.number().int().positive().optional(),
  comidas: z.array(z.object({
    momento: z.enum(["desayuno", "media_manana", "almuerzo", "merienda", "cena"]),
    hora_sugerida: z.string().optional(),
    descripcion: z.string().min(1),
    calorias: z.number().int().min(0).optional(),
    proteinas_g: z.number().int().min(0).optional(),
    carbohidratos_g: z.number().int().min(0).optional(),
    grasas_g: z.number().int().min(0).optional(),
  })).optional(),
})

// GET /api/planes-alimenticios/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const plan = await prisma.planAlimenticio.findFirst({
    where: { id, coach_id: coach!.id, deleted_at: null },
    include: { comidas: { orderBy: { momento: "asc" } } },
  })
  if (!plan) return errorResponse("NO_ENCONTRADO", "Plan no encontrado", 404)

  return NextResponse.json({ plan })
}

// PATCH /api/planes-alimenticios/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = editarPlanSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const { comidas, ...resto } = parsed.data

  if (comidas !== undefined) {
    await prisma.comidaPlan.deleteMany({ where: { plan_id: id } })
  }

  const planActualizado = await prisma.planAlimenticio.update({
    where: { id },
    data: {
      ...(resto.nombre && { nombre: resto.nombre }),
      ...(resto.objetivo && { objetivo: resto.objetivo as Objetivo }),
      ...(resto.calorias_objetivo && { calorias_objetivo: resto.calorias_objetivo }),
      ...(comidas !== undefined && {
        comidas: {
          create: comidas.map((c) => ({
            momento: c.momento as MomentoDia,
            hora_sugerida: c.hora_sugerida ? new Date(`1970-01-01T${c.hora_sugerida}`) : undefined,
            descripcion: c.descripcion,
            calorias: c.calorias,
            proteinas_g: c.proteinas_g,
            carbohidratos_g: c.carbohidratos_g,
            grasas_g: c.grasas_g,
          })),
        },
      }),
    },
    include: { comidas: { orderBy: { momento: "asc" } } },
  })

  return NextResponse.json({ ok: true, plan: planActualizado })
}

// DELETE /api/planes-alimenticios/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const plan = await prisma.planAlimenticio.findFirst({
    where: { id, coach_id: coach!.id, deleted_at: null },
  })
  if (!plan) return errorResponse("NO_ENCONTRADO", "Plan no encontrado", 404)

  await prisma.planAlimenticio.update({
    where: { id },
    data: { deleted_at: new Date(), activo: false },
  })

  return NextResponse.json({ ok: true })
}
