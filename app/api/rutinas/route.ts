import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, requireFeature, errorResponse } from "@/lib/plan-guard"
import type { Objetivo } from "@prisma/client"

const ejercicioSchema = z.object({
  nombre: z.string().min(1),
  series: z.number().int().positive(),
  repeticiones: z.string().min(1),
  descanso_segundos: z.number().int().min(0).optional(),
  rpe: z.string().optional(),
  notas: z.string().optional(),
})

const rutinaSchema = z.object({
  nombre: z.string().min(2).max(200),
  descripcion: z.string().optional(),
  objetivo: z.enum(["hipertrofia", "perdida_grasa", "fuerza", "resistencia", "general"]).optional(),
  dias_semana: z.array(z.string()).optional(),
  duracion_minutos: z.number().int().positive().optional(),
  es_template: z.boolean().default(false),
  alumno_id: z.string().uuid().optional().nullable(),
  ejercicios: z.array(ejercicioSchema).optional(),
})

// GET /api/rutinas
export async function GET(req: NextRequest) {
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const objetivo = searchParams.get("objetivo")
  const tipo = searchParams.get("tipo") // "template" | "asignada" | null

  const rutinas = await prisma.rutina.findMany({
    where: {
      coach_id: coach!.id,
      deleted_at: null,
      activa: true,
      ...(objetivo ? { objetivo: objetivo as Objetivo } : {}),
      ...(tipo === "template" ? { es_template: true } : tipo === "asignada" ? { es_template: false, alumno_id: { not: null } } : {}),
    },
    include: {
      ejercicios: { orderBy: { orden: "asc" } },
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

  const body = await req.json()
  const parsed = rutinaSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const { nombre, descripcion, objetivo, dias_semana, duracion_minutos, es_template, alumno_id, ejercicios } = parsed.data

  // Validar template: solo plan Inicial
  if (es_template) {
    const featErr = requireFeature(coach!, "templates_rutinas")
    if (featErr) return featErr
  }

  // Si se asigna a un alumno, verificar pertenencia
  if (alumno_id) {
    const alumno = await prisma.alumno.findFirst({
      where: { id: alumno_id, coach_id: coach!.id, deleted_at: null },
    })
    if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

    // Desactivar rutina anterior del alumno
    await prisma.rutina.updateMany({
      where: { alumno_id, activa: true, deleted_at: null },
      data: { activa: false },
    })
  }

  const rutina = await prisma.rutina.create({
    data: {
      coach_id: coach!.id,
      alumno_id: alumno_id ?? null,
      nombre,
      descripcion,
      objetivo: objetivo as Objetivo | undefined,
      dias_semana: dias_semana ?? [],
      duracion_minutos,
      es_template,
      activa: true,
      ejercicios: {
        create: (ejercicios ?? []).map((ej, i) => ({
          orden: i + 1,
          nombre: ej.nombre,
          series: ej.series,
          repeticiones: ej.repeticiones,
          descanso_segundos: ej.descanso_segundos,
          rpe: ej.rpe,
          notas: ej.notas,
        })),
      },
    },
    include: { ejercicios: { orderBy: { orden: "asc" } } },
  })

  return NextResponse.json({ ok: true, rutina }, { status: 201 })
}
