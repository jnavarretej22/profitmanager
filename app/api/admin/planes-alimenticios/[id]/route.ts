import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { Objetivo, DiaSemana, MomentoDia, PlanActual } from "@prisma/client"

const ORDEN_DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]

const comidaSchema = z.object({
  momento:         z.enum(["desayuno", "media_manana", "almuerzo", "merienda", "cena"]),
  hora_sugerida:   z.string().optional(),
  descripcion:     z.string().min(1),
  calorias:        z.number().int().min(0).optional(),
  proteinas_g:     z.number().int().min(0).optional(),
  carbohidratos_g: z.number().int().min(0).optional(),
  grasas_g:        z.number().int().min(0).optional(),
})

const diaSchema = z.object({
  dia_semana:  z.enum(["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]),
  nombre_foco: z.string().optional(),
  es_libre:    z.boolean().default(false),
  comidas:     z.array(comidaSchema).optional(),
})

const patchSchema = z.object({
  nombre:            z.string().min(2).max(200),
  objetivo:          z.enum(["hipertrofia","perdida_grasa","fuerza","resistencia","general"]).optional(),
  calorias_objetivo: z.number().int().positive().optional(),
  plan_requerido:    z.enum(["gratis","inicial"]).optional().nullable(),
  dias:              z.array(diaSchema).optional(),
})

// GET /api/admin/planes-alimenticios/[id] — detalle del template
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const plan = await prisma.planAlimenticio.findFirst({
    where: { id, es_template: true, es_template_sistema: true, deleted_at: null },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { comidas: { orderBy: { orden: "asc" } } },
      },
    },
  })

  if (!plan) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  return NextResponse.json({ plan })
}

// PATCH /api/admin/planes-alimenticios/[id] — actualiza el template (reemplaza días/comidas)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const existente = await prisma.planAlimenticio.findUnique({
    where:  { id },
    select: { id: true, es_template: true, es_template_sistema: true, deleted_at: true },
  })
  if (!existente || existente.deleted_at) {
    return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  }
  if (!existente.es_template || !existente.es_template_sistema) {
    return NextResponse.json(
      { error: "SOLO_TEMPLATES_SISTEMA", mensaje: "Solo se pueden editar templates del sistema" },
      { status: 400 }
    )
  }

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "DATOS_INVALIDOS", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { nombre, objetivo, calorias_objetivo, plan_requerido, dias } = parsed.data

  await prisma.$transaction(async (tx) => {
    await tx.planAlimenticio.update({
      where: { id },
      data: {
        nombre,
        objetivo:          objetivo as Objetivo | undefined,
        calorias_objetivo,
        plan_requerido:    (plan_requerido ?? "inicial") as PlanActual,
      },
    })

    await tx.diaPlan.deleteMany({ where: { plan_id: id } })

    for (let di = 0; di < (dias ?? []).length; di++) {
      const d = dias![di]
      await tx.diaPlan.create({
        data: {
          plan_id:     id,
          dia_semana:  d.dia_semana as DiaSemana,
          nombre_foco: d.nombre_foco || null,
          es_libre:    d.es_libre,
          orden:       ORDEN_DIAS.indexOf(d.dia_semana) + 1 || di + 1,
          comidas: {
            create: (d.comidas ?? []).map((c, cIdx) => ({
              orden:           cIdx + 1,
              momento:         c.momento as MomentoDia,
              hora_sugerida:   c.hora_sugerida ? new Date(`1970-01-01T${c.hora_sugerida}`) : undefined,
              descripcion:     c.descripcion,
              calorias:        c.calorias,
              proteinas_g:     c.proteinas_g,
              carbohidratos_g: c.carbohidratos_g,
              grasas_g:        c.grasas_g,
            })),
          },
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/planes-alimenticios/[id] — soft-delete del template
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const plan = await prisma.planAlimenticio.findUnique({
    where:  { id },
    select: { id: true, es_template: true, es_template_sistema: true, deleted_at: true },
  })

  if (!plan || plan.deleted_at) {
    return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  }
  if (!plan.es_template || !plan.es_template_sistema) {
    return NextResponse.json(
      { error: "SOLO_TEMPLATES_SISTEMA", mensaje: "Solo se pueden eliminar templates del sistema" },
      { status: 400 }
    )
  }

  await prisma.planAlimenticio.update({
    where: { id },
    data:  { deleted_at: new Date(), activo: false },
  })

  return NextResponse.json({ ok: true })
}
