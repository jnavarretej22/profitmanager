import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, requireFeature, errorResponse } from "@/lib/plan-guard"
import type { Objetivo, DiaSemana } from "@prisma/client"

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

const rutinaSchema = z.object({
  nombre:           z.string().min(2).max(200),
  descripcion:      z.string().optional(),
  objetivo:         z.enum(["hipertrofia","perdida_grasa","fuerza","resistencia","general"]).optional(),
  duracion_minutos: z.number().int().positive().optional(),
  es_template:      z.boolean().default(false),
  alumno_id:        z.string().uuid().optional().nullable(),
  fecha_fin:        z.string().date().optional().nullable(),
  dias:             z.array(diaSchema).min(1),
})

// GET /api/rutinas
export async function GET(req: NextRequest) {
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const objetivo = searchParams.get("objetivo")
  const tipo     = searchParams.get("tipo") // "template" | "asignada" | null

  const rutinas = await prisma.rutina.findMany({
    where: {
      coach_id:   coach!.id,
      deleted_at: null,
      activa:     true,
      ...(objetivo ? { objetivo: objetivo as Objetivo } : {}),
      ...(tipo === "template"
        ? { es_template: true }
        : tipo === "asignada"
        ? { es_template: false, alumno_id: { not: null } }
        : {}),
    },
    include: {
      dias: {
        orderBy:  { orden: "asc" },
        include:  { ejercicios: { orderBy: { orden: "asc" } } },
      },
      alumno: { include: { user: { select: { nombre: true, apellido: true } } } },
    },
    orderBy: { updated_at: "desc" },
  })

  return NextResponse.json({ rutinas })
}

// POST /api/rutinas
export async function POST(req: NextRequest) {
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const body   = await req.json()
  const parsed = rutinaSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const { nombre, descripcion, objetivo, duracion_minutos, es_template, alumno_id, fecha_fin, dias } = parsed.data

  if (es_template) {
    const featErr = requireFeature(coach!, "templates_rutinas")
    if (featErr) return featErr
  }

  if (alumno_id) {
    const alumno = await prisma.alumno.findFirst({
      where: { id: alumno_id, coach_id: coach!.id, deleted_at: null },
    })
    if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)
    // Nota: se permiten múltiples rutinas activas simultáneas por alumno (split A/B)
  }

  const rutina = await prisma.rutina.create({
    data: {
      coach_id:         coach!.id,
      alumno_id:        alumno_id ?? null,
      nombre,
      descripcion,
      objetivo:         objetivo as Objetivo | undefined,
      duracion_minutos,
      es_template,
      activa:           true,
      fecha_fin:        fecha_fin ? new Date(fecha_fin) : null,
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
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
    },
  })

  return NextResponse.json({ ok: true, rutina }, { status: 201 })
}
