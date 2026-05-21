import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, requireFeature, errorResponse } from "@/lib/plan-guard"
import type { MomentoDia, DiaSemana } from "@prisma/client"

const asignarSchema = z.object({
  alumno_id: z.string().uuid(),
  fecha_fin: z.string().date().optional().nullable(),
})

// POST /api/planes-alimenticios/[id]/asignar
// Clona el template y lo asigna al alumno (nunca muta el template original)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const template = await prisma.planAlimenticio.findFirst({
    where: { id, coach_id: coach!.id, deleted_at: null },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { comidas: { orderBy: { orden: "asc" } } },
      },
    },
  })
  if (!template) return errorResponse("NO_ENCONTRADO", "Plan no encontrado", 404)

  if (template.es_template) {
    const featErr = requireFeature(coach!, "templates_dietas_objetivo")
    if (featErr) return featErr
  }

  const body   = await req.json()
  const parsed = asignarSchema.safeParse(body)
  if (!parsed.success) return errorResponse("DATOS_INVALIDOS", "alumno_id requerido", 400)

  const { alumno_id, fecha_fin } = parsed.data

  const alumno = await prisma.alumno.findFirst({
    where: { id: alumno_id, coach_id: coach!.id, deleted_at: null },
  })
  if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

  const planAsignado = await prisma.$transaction(async (tx) => {
    await tx.planAlimenticio.updateMany({
      where: { alumno_id, activo: true, deleted_at: null },
      data:  { activo: false },
    })

    return tx.planAlimenticio.create({
      data: {
        coach_id:          coach!.id,
        alumno_id,
        nombre:            template.nombre,
        objetivo:          template.objetivo,
        calorias_objetivo: template.calorias_objetivo,
        plan_requerido:    template.plan_requerido,
        es_template:       false,
        activo:            true,
        fecha_fin:         fecha_fin ? new Date(fecha_fin) : null,
        dias: {
          create: template.dias.map((d) => ({
            dia_semana:  d.dia_semana as DiaSemana,
            nombre_foco: d.nombre_foco,
            es_libre:    d.es_libre,
            orden:       d.orden,
            comidas: {
              create: d.comidas.map((c) => ({
                orden:           c.orden,
                momento:         c.momento as MomentoDia,
                hora_sugerida:   c.hora_sugerida,
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
  })

  return NextResponse.json({ ok: true, plan: planAsignado })
}
