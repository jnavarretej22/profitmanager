import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, requireFeature, errorResponse } from "@/lib/plan-guard"

const clonarSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
})

// POST /api/rutinas/[id]/clonar-template
// Clona una rutina (típicamente asignada) como nuevo template del coach.
// El resultado es es_template=true, alumno_id=null, sin fecha_fin.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }           = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const featErr = requireFeature(coach!, "templates_rutinas")
  if (featErr) return featErr

  const rutina = await prisma.rutina.findFirst({
    where: { id, coach_id: coach!.id, deleted_at: null },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
    },
  })
  if (!rutina) return errorResponse("NO_ENCONTRADO", "Rutina no encontrada", 404)

  if (rutina.es_template) {
    return errorResponse("DATOS_INVALIDOS", "Esta rutina ya es un template", 400)
  }

  const body   = await req.json().catch(() => ({}))
  const parsed = clonarSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "Datos inválidos", 400)

  const nombreFinal = parsed.data.nombre?.trim() || `${rutina.nombre} (template)`

  const template = await prisma.rutina.create({
    data: {
      coach_id:         coach!.id,
      alumno_id:        null,
      nombre:           nombreFinal,
      descripcion:      rutina.descripcion,
      objetivo:         rutina.objetivo ?? undefined,
      duracion_minutos: rutina.duracion_minutos ?? undefined,
      es_template:      true,
      activa:           true,
      fecha_fin:        null,
      dias: {
        create: rutina.dias.map((d) => ({
          dia_semana:  d.dia_semana,
          nombre_foco: d.nombre_foco,
          es_descanso: d.es_descanso,
          orden:       d.orden,
          ejercicios: {
            create: d.ejercicios.map((ej) => ({
              orden:             ej.orden,
              nombre:            ej.nombre,
              series:            ej.series,
              repeticiones:      ej.repeticiones,
              peso_kg:           ej.peso_kg,
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

  return NextResponse.json({ ok: true, template }, { status: 201 })
}
