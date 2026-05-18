import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, errorResponse } from "@/lib/plan-guard"
import type { Objetivo } from "@prisma/client"

const editarRutinaSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  descripcion: z.string().optional(),
  objetivo: z.enum(["hipertrofia", "perdida_grasa", "fuerza", "resistencia", "general"]).optional(),
  dias_semana: z.array(z.string()).optional(),
  duracion_minutos: z.number().int().positive().optional(),
  ejercicios: z.array(z.object({
    nombre: z.string().min(1),
    series: z.number().int().positive(),
    repeticiones: z.string().min(1),
    descanso_segundos: z.number().int().min(0).optional(),
    rpe: z.string().optional(),
    notas: z.string().optional(),
  })).optional(),
})

async function verificarRutina(coachId: string, rutinaId: string) {
  return prisma.rutina.findFirst({
    where: { id: rutinaId, coach_id: coachId, deleted_at: null },
    include: { ejercicios: { orderBy: { orden: "asc" } } },
  })
}

// GET /api/rutinas/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const rutina = await verificarRutina(coach!.id, id)
  if (!rutina) return errorResponse("NO_ENCONTRADO", "Rutina no encontrada", 404)

  return NextResponse.json({ rutina })
}

// PATCH /api/rutinas/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const rutina = await verificarRutina(coach!.id, id)
  if (!rutina) return errorResponse("NO_ENCONTRADO", "Rutina no encontrada", 404)

  const body = await req.json()
  const parsed = editarRutinaSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const { ejercicios, ...resto } = parsed.data

  // Si hay ejercicios: reemplazar todos (delete + create)
  if (ejercicios !== undefined) {
    await prisma.ejercicioRutina.deleteMany({ where: { rutina_id: id } })
  }

  const rutinaActualizada = await prisma.rutina.update({
    where: { id },
    data: {
      ...( resto.nombre && { nombre: resto.nombre }),
      ...( resto.descripcion !== undefined && { descripcion: resto.descripcion }),
      ...( resto.objetivo && { objetivo: resto.objetivo as Objetivo }),
      ...( resto.dias_semana && { dias_semana: resto.dias_semana }),
      ...( resto.duracion_minutos && { duracion_minutos: resto.duracion_minutos }),
      ...(ejercicios !== undefined && {
        ejercicios: {
          create: ejercicios.map((ej, i) => ({
            orden: i + 1,
            nombre: ej.nombre,
            series: ej.series,
            repeticiones: ej.repeticiones,
            descanso_segundos: ej.descanso_segundos,
            rpe: ej.rpe,
            notas: ej.notas,
          })),
        },
      }),
    },
    include: { ejercicios: { orderBy: { orden: "asc" } } },
  })

  return NextResponse.json({ ok: true, rutina: rutinaActualizada })
}

// DELETE /api/rutinas/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const rutina = await verificarRutina(coach!.id, id)
  if (!rutina) return errorResponse("NO_ENCONTRADO", "Rutina no encontrada", 404)

  await prisma.rutina.update({ where: { id }, data: { deleted_at: new Date(), activa: false } })

  return NextResponse.json({ ok: true })
}
