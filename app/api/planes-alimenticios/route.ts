import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, requireFeature, errorResponse } from "@/lib/plan-guard"
import type { Objetivo, MomentoDia, DiaSemana } from "@prisma/client"

const comidaSchema = z.object({
  momento:        z.enum(["desayuno", "media_manana", "almuerzo", "merienda", "cena"]),
  hora_sugerida:  z.string().optional(),
  descripcion:    z.string().min(1),
  calorias:       z.number().int().min(0).optional(),
  proteinas_g:    z.number().int().min(0).optional(),
  carbohidratos_g:z.number().int().min(0).optional(),
  grasas_g:       z.number().int().min(0).optional(),
})

const diaSchema = z.object({
  dia_semana:  z.enum(["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]),
  nombre_foco: z.string().optional(),
  es_libre:    z.boolean().default(false),
  comidas:     z.array(comidaSchema).optional(),
})

const planSchema = z.object({
  nombre:            z.string().min(2).max(200),
  objetivo:          z.enum(["hipertrofia","perdida_grasa","fuerza","resistencia","general"]).optional(),
  calorias_objetivo: z.number().int().positive().optional(),
  es_template:       z.boolean().default(false),
  alumno_id:         z.string().uuid().optional().nullable(),
  fecha_fin:         z.string().date().optional().nullable(),
  dias:              z.array(diaSchema).optional(),
})

const ORDEN_DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]

// GET /api/planes-alimenticios
export async function GET(req: NextRequest) {
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const objetivo = searchParams.get("objetivo")
  const tipo     = searchParams.get("tipo")

  const planes = await prisma.planAlimenticio.findMany({
    where: {
      coach_id:   coach!.id,
      deleted_at: null,
      activo:     true,
      ...(objetivo ? { objetivo: objetivo as Objetivo } : {}),
      ...(tipo === "template"  ? { es_template: true } :
          tipo === "asignada"  ? { es_template: false, alumno_id: { not: null } } : {}),
    },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { comidas: { orderBy: { orden: "asc" } } },
      },
      alumno: { include: { user: { select: { nombre: true, apellido: true } } } },
    },
    orderBy: { updated_at: "desc" },
  })

  return NextResponse.json({ planes })
}

// POST /api/planes-alimenticios
export async function POST(req: NextRequest) {
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const body   = await req.json()
  const parsed = planSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const { nombre, objetivo, calorias_objetivo, es_template, alumno_id, fecha_fin, dias } = parsed.data

  if (es_template) {
    const featErr = requireFeature(coach!, "templates_dietas_objetivo")
    if (featErr) return featErr
  }

  if (alumno_id) {
    const alumno = await prisma.alumno.findFirst({
      where: { id: alumno_id, coach_id: coach!.id, deleted_at: null },
    })
    if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

    await prisma.planAlimenticio.updateMany({
      where: { alumno_id, activo: true, deleted_at: null },
      data:  { activo: false },
    })
  }

  const plan = await prisma.planAlimenticio.create({
    data: {
      coach_id:          coach!.id,
      alumno_id:         alumno_id ?? null,
      nombre,
      objetivo:          objetivo as Objetivo | undefined,
      calorias_objetivo,
      es_template,
      activo:            true,
      fecha_fin:         fecha_fin ? new Date(fecha_fin) : null,
      dias: {
        create: (dias ?? []).map((d, idx) => ({
          dia_semana:  d.dia_semana as DiaSemana,
          nombre_foco: d.nombre_foco || null,
          es_libre:    d.es_libre,
          orden:       idx + 1,
          comidas: {
            create: (d.comidas ?? []).map((c, cIdx) => ({
              orden:          cIdx + 1,
              momento:        c.momento as MomentoDia,
              hora_sugerida:  c.hora_sugerida ? new Date(`1970-01-01T${c.hora_sugerida}`) : undefined,
              descripcion:    c.descripcion,
              calorias:       c.calorias,
              proteinas_g:    c.proteinas_g,
              carbohidratos_g:c.carbohidratos_g,
              grasas_g:       c.grasas_g,
            })),
          },
        })),
      },
    },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { comidas: { orderBy: { orden: "asc" } } },
      },
    },
  })

  return NextResponse.json({ ok: true, plan }, { status: 201 })
}
