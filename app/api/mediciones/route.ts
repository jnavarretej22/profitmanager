import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getCoachAutenticado, requireModoActivo, errorResponse } from "@/lib/plan-guard"

const medicionSchema = z.object({
  alumno_id: z.string().uuid("ID inválido"),
  fecha: z.string(),
  peso_kg: z.number().positive().optional(),
  cintura_cm: z.number().positive().optional(),
  cadera_cm: z.number().positive().optional(),
  pecho_cm: z.number().positive().optional(),
  brazo_cm: z.number().positive().optional(),
  pierna_cm: z.number().positive().optional(),
  porcentaje_grasa: z.number().min(0).max(100).optional(),
  notas: z.string().optional(),
})

// POST /api/mediciones — registrar medición
export async function POST(req: NextRequest) {
  const { coach, error } = await getCoachAutenticado()
  if (error) return error

  const modoError = requireModoActivo(coach!)
  if (modoError) return modoError

  const body = await req.json()
  const parsed = medicionSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse("DATOS_INVALIDOS", "Datos de medición inválidos", 400)
  }

  const { alumno_id, ...resto } = parsed.data

  // Verificar que el alumno pertenece al coach
  const alumno = await prisma.alumno.findFirst({
    where: { id: alumno_id, coach_id: coach!.id, deleted_at: null },
  })
  if (!alumno) return errorResponse("NO_ENCONTRADO", "Alumno no encontrado", 404)

  // Obtener user_id del coach
  const coachData = await prisma.coach.findUnique({
    where: { id: coach!.id },
    select: { user_id: true },
  })

  const medicion = await prisma.medicion.create({
    data: {
      alumno_id,
      registrado_por: coachData!.user_id,
      fecha: new Date(resto.fecha),
      peso_kg: resto.peso_kg,
      cintura_cm: resto.cintura_cm,
      cadera_cm: resto.cadera_cm,
      pecho_cm: resto.pecho_cm,
      brazo_cm: resto.brazo_cm,
      pierna_cm: resto.pierna_cm,
      porcentaje_grasa: resto.porcentaje_grasa,
      notas: resto.notas,
    },
  })

  return NextResponse.json({ ok: true, medicion }, { status: 201 })
}
