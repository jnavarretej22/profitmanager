import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { Objetivo, DiaSemana, PlanActual } from "@prisma/client"

const DIAS_ORDEN: DiaSemana[] = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]

const ejercicioSchema = z.object({
  nombre:            z.string().min(1),
  series:            z.number().int().positive(),
  repeticiones:      z.string().min(1),
  peso_kg:           z.number().nonnegative().optional().nullable(),
  descanso_segundos: z.number().int().min(0).optional(),
  rpe:               z.string().optional(),
  progresion:        z.string().max(80).optional(),
  notas:             z.string().optional(),
})

const diaSchema = z.object({
  dia_semana:  z.enum(["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]),
  nombre_foco: z.string().max(100).optional(),
  es_descanso: z.boolean().default(false),
  ejercicios:  z.array(ejercicioSchema).default([]),
})

const patchSchema = z.object({
  nombre:           z.string().min(2).max(200),
  descripcion:      z.string().optional(),
  objetivo:         z.enum(["hipertrofia","perdida_grasa","fuerza","resistencia","general"]).optional(),
  duracion_minutos: z.number().int().positive().optional(),
  plan_requerido:   z.enum(["gratis","inicial"]).optional().nullable(),
  dias:             z.array(diaSchema).min(1),
})

// GET /api/admin/rutinas/[id] — detalle del template
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const rutina = await prisma.rutina.findFirst({
    where: { id, es_template: true, es_template_sistema: true, deleted_at: null },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
    },
  })

  if (!rutina) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  return NextResponse.json({ rutina })
}

// PATCH /api/admin/rutinas/[id] — actualiza un template (reemplaza días y ejercicios)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const existente = await prisma.rutina.findUnique({
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

  const { nombre, descripcion, objetivo, duracion_minutos, plan_requerido, dias } = parsed.data

  await prisma.$transaction(async (tx) => {
    await tx.rutina.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        objetivo:         objetivo as Objetivo | undefined,
        duracion_minutos,
        plan_requerido:   (plan_requerido ?? "inicial") as PlanActual,
      },
    })

    // Reemplazar días y ejercicios completos (cascade: DiaRutina onDelete cascade ejercicios)
    await tx.diaRutina.deleteMany({ where: { rutina_id: id } })

    for (let di = 0; di < dias.length; di++) {
      const d = dias[di]
      await tx.diaRutina.create({
        data: {
          rutina_id:   id,
          dia_semana:  d.dia_semana as DiaSemana,
          nombre_foco: d.nombre_foco,
          es_descanso: d.es_descanso,
          orden:       DIAS_ORDEN.indexOf(d.dia_semana as DiaSemana) + 1 || di + 1,
          ejercicios: {
            create: d.ejercicios.map((ej, i) => ({
              orden:             i + 1,
              nombre:            ej.nombre,
              series:            ej.series,
              repeticiones:      ej.repeticiones,
              peso_kg:           ej.peso_kg ?? null,
              descanso_segundos: ej.descanso_segundos,
              rpe:               ej.rpe,
              progresion:        ej.progresion,
              notas:             ej.notas,
            })),
          },
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/rutinas/[id] — soft-delete del template
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const rutina = await prisma.rutina.findUnique({
    where:  { id },
    select: { id: true, es_template: true, es_template_sistema: true, deleted_at: true },
  })

  if (!rutina || rutina.deleted_at) {
    return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  }
  if (!rutina.es_template || !rutina.es_template_sistema) {
    return NextResponse.json(
      { error: "SOLO_TEMPLATES_SISTEMA", mensaje: "Solo se pueden eliminar templates del sistema" },
      { status: 400 }
    )
  }

  await prisma.rutina.update({
    where: { id },
    data:  { deleted_at: new Date(), activa: false },
  })

  return NextResponse.json({ ok: true })
}
