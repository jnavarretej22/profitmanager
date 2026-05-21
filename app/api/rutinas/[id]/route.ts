import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, errorResponse } from "@/lib/plan-guard"
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

const editarRutinaSchema = z.object({
  nombre:           z.string().min(2).max(200).optional(),
  descripcion:      z.string().optional(),
  objetivo:         z.enum(["hipertrofia","perdida_grasa","fuerza","resistencia","general"]).optional(),
  duracion_minutos: z.number().int().positive().optional(),
  fecha_fin:        z.string().date().optional().nullable(),
  dias:             z.array(diaSchema).min(1).optional(),
})

async function verificarRutina(coachId: string, rutinaId: string) {
  return prisma.rutina.findFirst({
    where:   { id: rutinaId, coach_id: coachId, deleted_at: null },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
    },
  })
}

// GET /api/rutinas/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }          = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const rutina = await verificarRutina(coach!.id, id)
  if (!rutina) return errorResponse("NO_ENCONTRADO", "Rutina no encontrada", 404)

  return NextResponse.json({ rutina })
}

// PATCH /api/rutinas/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }          = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const rutina = await verificarRutina(coach!.id, id)
  if (!rutina) return errorResponse("NO_ENCONTRADO", "Rutina no encontrada", 404)

  const body   = await req.json()
  const parsed = editarRutinaSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const { dias, fecha_fin, ...resto } = parsed.data

  // Si hay días: reemplazar todos los días y sus ejercicios
  if (dias !== undefined) {
    await prisma.diaRutina.deleteMany({ where: { rutina_id: id } })
  }

  const rutinaActualizada = await prisma.rutina.update({
    where: { id },
    data: {
      ...(resto.nombre           && { nombre: resto.nombre }),
      ...(resto.descripcion !== undefined && { descripcion: resto.descripcion }),
      ...(resto.objetivo         && { objetivo: resto.objetivo as Objetivo }),
      ...(resto.duracion_minutos && { duracion_minutos: resto.duracion_minutos }),
      ...(fecha_fin !== undefined && { fecha_fin: fecha_fin ? new Date(fecha_fin) : null }),
      ...(dias !== undefined && {
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
      }),
    },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
    },
  })

  return NextResponse.json({ ok: true, rutina: rutinaActualizada })
}

// DELETE /api/rutinas/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }           = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const rutina = await verificarRutina(coach!.id, id)
  if (!rutina) return errorResponse("NO_ENCONTRADO", "Rutina no encontrada", 404)

  await prisma.rutina.update({ where: { id }, data: { deleted_at: new Date(), activa: false } })

  return NextResponse.json({ ok: true })
}
