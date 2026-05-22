import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { obtenerCoachSistemaId } from "@/lib/sistema-coach"
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

const crearSchema = z.object({
  nombre:           z.string().min(2).max(200),
  descripcion:      z.string().optional(),
  objetivo:         z.enum(["hipertrofia","perdida_grasa","fuerza","resistencia","general"]).optional(),
  duracion_minutos: z.number().int().positive().optional(),
  plan_requerido:   z.enum(["gratis","inicial"]).optional().nullable(),
  dias:             z.array(diaSchema).min(1),
})

// GET /api/admin/rutinas — listado de templates del sistema
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const objetivo = searchParams.get("objetivo")
  const plan     = searchParams.get("plan")

  const templates = await prisma.rutina.findMany({
    where: {
      es_template:         true,
      es_template_sistema: true,
      deleted_at:          null,
      activa:              true,
      ...(objetivo ? { objetivo: objetivo as Objetivo } : {}),
      ...(plan     ? { plan_requerido: plan as PlanActual } : {}),
    },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
    },
    orderBy: { updated_at: "desc" },
  })

  return NextResponse.json({ templates })
}

// POST /api/admin/rutinas — crea un template del sistema
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const primerError =
      Object.entries(flat.fieldErrors).find(([, errs]) => errs && errs.length > 0)
    const mensaje = primerError
      ? `${primerError[0]}: ${primerError[1]?.[0]}`
      : flat.formErrors[0] ?? "Datos inválidos"
    console.error("[admin/rutinas] Validación falló:", JSON.stringify(flat))
    return NextResponse.json(
      { error: "DATOS_INVALIDOS", mensaje, detalles: flat.fieldErrors },
      { status: 400 }
    )
  }

  const { nombre, descripcion, objetivo, duracion_minutos, plan_requerido, dias } = parsed.data
  const sistemaCoachId = await obtenerCoachSistemaId()

  const rutina = await prisma.rutina.create({
    data: {
      coach_id:            sistemaCoachId,
      alumno_id:           null,
      es_template:         true,
      es_template_sistema: true,
      plan_requerido:      (plan_requerido ?? "inicial") as PlanActual,
      nombre,
      descripcion,
      objetivo:            objetivo as Objetivo | undefined,
      duracion_minutos,
      activa:              true,
      dias: {
        create: dias.map((d, di) => ({
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
        })),
      },
    },
  })

  return NextResponse.json({ ok: true, rutina_id: rutina.id }, { status: 201 })
}
