import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { requireModoActivo } from "@/lib/plan-guard"

const patchSchema = z.object({
  estado:           z.enum(["agendada","completada","cancelada"]).optional(),
  titulo:           z.string().min(1).optional(),
  alumno_id:        z.string().uuid().optional(),
  fecha_inicio:     z.string().datetime().optional(),
  fecha_fin:        z.string().datetime().optional(),
  modalidad:        z.enum(["online","presencial"]).optional(),
  ubicacion:        z.string().nullable().optional(),
  meet_link:        z.string().nullable().optional(),
  meet_link_manual: z.string().url().nullable().optional(),  // alias del cliente
  notas:            z.string().nullable().optional(),
}).refine(
  (d) => {
    if (d.fecha_inicio && d.fecha_fin) {
      return new Date(d.fecha_fin) > new Date(d.fecha_inicio)
    }
    return true
  },
  { message: "fecha_fin debe ser posterior a fecha_inicio", path: ["fecha_fin"] }
)

async function getCoachParsed(coachId: string) {
  return prisma.coach.findUnique({
    where: { id: coachId },
    select: { id: true, plan_actual: true, estado_plan: true },
  })
}

// GET /api/citas/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params
  const cita = await prisma.cita.findFirst({
    where: { id, coach_id: session.user.coachId },
    include: { alumno: { include: { user: { select: { nombre: true, apellido: true } } } } },
  })
  if (!cita) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  return NextResponse.json({ cita })
}

// PATCH /api/citas/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const coach = await getCoachParsed(session.user.coachId)
  if (!coach) return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })

  const soloLectura = requireModoActivo(coach)
  if (soloLectura) return soloLectura

  const { id } = await params
  const cita = await prisma.cita.findFirst({ where: { id, coach_id: coach.id } })
  if (!cita) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "DATOS_INVALIDOS", detalle: parsed.error.flatten() }, { status: 400 })

  // Verificar alumno si cambia
  const { meet_link_manual, alumno_id, fecha_inicio, fecha_fin, ...rest } = parsed.data
  if (alumno_id) {
    const alumno = await prisma.alumno.findFirst({ where: { id: alumno_id, coach_id: coach.id, activo: true } })
    if (!alumno) return NextResponse.json({ error: "ALUMNO_NO_PERTENECE_A_COACH" }, { status: 404 })
  }

  // meet_link_manual actúa como meet_link si no hay meet automático
  const meet_link = rest.meet_link !== undefined ? rest.meet_link : (meet_link_manual ?? undefined)

  const actualizada = await prisma.cita.update({
    where: { id },
    data: {
      ...rest,
      ...(alumno_id && { alumno_id }),
      ...(meet_link !== undefined && { meet_link }),
      ...(fecha_inicio && { fecha_inicio: new Date(fecha_inicio) }),
      ...(fecha_fin   && { fecha_fin:    new Date(fecha_fin) }),
    },
  })
  return NextResponse.json({ cita: actualizada })
}

// DELETE /api/citas/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const coach = await getCoachParsed(session.user.coachId)
  if (!coach) return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })

  const soloLectura = requireModoActivo(coach)
  if (soloLectura) return soloLectura

  const { id } = await params
  const cita = await prisma.cita.findFirst({ where: { id, coach_id: coach.id } })
  if (!cita) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  await prisma.cita.update({ where: { id }, data: { estado: "cancelada" } })
  return NextResponse.json({ ok: true })
}
