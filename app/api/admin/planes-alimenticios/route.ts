import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { obtenerCoachSistemaId } from "@/lib/sistema-coach"
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

const crearSchema = z.object({
  nombre:            z.string().min(2).max(200),
  objetivo:          z.enum(["hipertrofia","perdida_grasa","fuerza","resistencia","general"]).optional(),
  calorias_objetivo: z.number().int().positive().optional(),
  plan_requerido:    z.enum(["gratis","inicial"]).optional().nullable(),
  dias:              z.array(diaSchema).optional(),
})

// GET /api/admin/planes-alimenticios — listado de templates del sistema
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const objetivo = searchParams.get("objetivo")
  const plan     = searchParams.get("plan")

  const templates = await prisma.planAlimenticio.findMany({
    where: {
      es_template:         true,
      es_template_sistema: true,
      deleted_at:          null,
      activo:              true,
      ...(objetivo ? { objetivo: objetivo as Objetivo } : {}),
      ...(plan     ? { plan_requerido: plan as PlanActual } : {}),
    },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { comidas: { orderBy: { orden: "asc" } } },
      },
    },
    orderBy: { updated_at: "desc" },
  })

  return NextResponse.json({ templates })
}

// POST /api/admin/planes-alimenticios — crea template de plan alimenticio del sistema
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "DATOS_INVALIDOS", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { nombre, objetivo, calorias_objetivo, plan_requerido, dias } = parsed.data
  const sistemaCoachId = await obtenerCoachSistemaId()

  const plan = await prisma.planAlimenticio.create({
    data: {
      coach_id:            sistemaCoachId,
      alumno_id:           null,
      es_template:         true,
      es_template_sistema: true,
      plan_requerido:      (plan_requerido ?? "inicial") as PlanActual,
      nombre,
      objetivo:            objetivo as Objetivo | undefined,
      calorias_objetivo,
      activo:              true,
      dias: {
        create: (dias ?? []).map((d, idx) => ({
          dia_semana:  d.dia_semana as DiaSemana,
          nombre_foco: d.nombre_foco || null,
          es_libre:    d.es_libre,
          orden:       ORDEN_DIAS.indexOf(d.dia_semana) + 1 || idx + 1,
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
        })),
      },
    },
  })

  return NextResponse.json({ ok: true, plan_id: plan.id }, { status: 201 })
}
