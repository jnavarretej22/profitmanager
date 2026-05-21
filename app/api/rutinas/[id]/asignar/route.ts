import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, requireFeature, errorResponse } from "@/lib/plan-guard"

const asignarSchema = z.object({
  alumno_id: z.string().uuid(),
  fecha_fin: z.string().date().optional().nullable(),
})

// POST /api/rutinas/[id]/asignar
// Clona el template y lo asigna al alumno, o asigna directamente si no es template.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }           = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const rutina = await prisma.rutina.findFirst({
    where:   { id, coach_id: coach!.id, deleted_at: null },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
    },
  })
  if (!rutina) return errorResponse("NO_ENCONTRADO", "Rutina no encontrada", 404)

  if (rutina.es_template) {
    const featErr = requireFeature(coach!, "templates_rutinas")
    if (featErr) return featErr
  }

  const body   = await req.json()
  const parsed = asignarSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "alumno_id requerido", 400)

  const { alumno_id, fecha_fin } = parsed.data
  const fechaFinDate = fecha_fin ? new Date(fecha_fin) : null

  const alumno = await prisma.alumno.findFirst({
    where: { id: alumno_id, coach_id: coach!.id, deleted_at: null },
  })
  if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

  // Nota: se permiten múltiples rutinas activas simultáneas por alumno (split A/B)
  const rutinaAsignada = await prisma.$transaction(async (tx) => {
    if (rutina.es_template) {
      return tx.rutina.create({
        data: {
          coach_id:           coach!.id,
          alumno_id,
          nombre:             rutina.nombre,
          descripcion:        rutina.descripcion,
          objetivo:           rutina.objetivo ?? undefined,
          duracion_minutos:   rutina.duracion_minutos ?? undefined,
          es_template:        false,
          activa:             true,
          fecha_fin:          fechaFinDate,
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
    }

    return tx.rutina.update({
      where: { id },
      data:  { alumno_id, activa: true, es_template: false, fecha_fin: fechaFinDate },
    })
  })

  return NextResponse.json({ ok: true, rutina: rutinaAsignada })
}
