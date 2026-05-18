import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { requireModoActivo } from "@/lib/plan-guard"
import { crearEventoConMeet } from "@/lib/google-calendar"

const citaSchema = z.object({
  titulo:           z.string().min(1, "Título requerido"),
  alumno_id:        z.string().uuid("ID de alumno inválido"),
  fecha_inicio:     z.string().datetime("Fecha inicio inválida"),
  fecha_fin:        z.string().datetime("Fecha fin inválida"),
  modalidad:        z.enum(["online", "presencial"]),
  ubicacion:        z.string().optional().nullable(),
  meet_link_manual: z.string().url().optional().nullable(),
  notas:            z.string().optional().nullable(),
}).refine(
  (d) => new Date(d.fecha_fin) > new Date(d.fecha_inicio),
  { message: "La fecha fin debe ser posterior a la fecha inicio", path: ["fecha_fin"] }
)

async function getCoach(coachId: string) {
  return prisma.coach.findUnique({
    where: { id: coachId },
    select: { id: true, plan_actual: true, estado_plan: true, google_calendar_token: true, user_id: true },
  })
}

// GET /api/citas
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const alumnoId  = searchParams.get("alumno_id")
  const estado    = searchParams.get("estado")
  const modalidad = searchParams.get("modalidad")

  const citas = await prisma.cita.findMany({
    where: {
      coach_id: session.user.coachId,
      ...(alumnoId  && { alumno_id:  alumnoId }),
      ...(estado    && { estado:     estado    as never }),
      ...(modalidad && { modalidad:  modalidad as never }),
    },
    include: {
      alumno: { include: { user: { select: { nombre: true, apellido: true } } } },
    },
    orderBy: { fecha_inicio: "asc" },
  })

  return NextResponse.json({ citas })
}

// POST /api/citas
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "coach" || !session.user.coachId) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const coach = await getCoach(session.user.coachId)
  if (!coach) return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })

  const soloLectura = requireModoActivo(coach)
  if (soloLectura) return soloLectura

  const body = await req.json()
  const parsed = citaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "DATOS_INVALIDOS", detalle: parsed.error.flatten() }, { status: 400 })
  }

  const { titulo, alumno_id, fecha_inicio, fecha_fin, modalidad, ubicacion, meet_link_manual, notas } = parsed.data

  const alumno = await prisma.alumno.findFirst({
    where: { id: alumno_id, coach_id: coach.id, activo: true, deleted_at: null },
    include: { user: { select: { nombre: true, apellido: true, id: true } } },
  })
  if (!alumno) return NextResponse.json({ error: "ALUMNO_NO_PERTENECE_A_COACH" }, { status: 404 })

  let meet_link: string | null = null
  let google_event_id: string | null = null

  if (modalidad === "online" && coach.plan_actual === "inicial" && coach.google_calendar_token) {
    const coachUser = await prisma.user.findUnique({ where: { id: coach.user_id }, select: { zona_horaria: true } })
    const resultado = await crearEventoConMeet(coach.google_calendar_token, {
      titulo,
      descripcion: `Sesión con ${alumno.user.nombre} ${alumno.user.apellido}. ${notas ?? ""}`.trim(),
      fechaInicio: new Date(fecha_inicio),
      fechaFin:    new Date(fecha_fin),
      zonaHoraria: coachUser?.zona_horaria ?? "America/Guayaquil",
    })
    if (resultado) {
      meet_link       = resultado.meet_link
      google_event_id = resultado.google_event_id
    }
  }

  if (!meet_link && meet_link_manual) meet_link = meet_link_manual

  const cita = await prisma.cita.create({
    data: {
      coach_id:        coach.id,
      alumno_id,
      titulo,
      fecha_inicio:    new Date(fecha_inicio),
      fecha_fin:       new Date(fecha_fin),
      modalidad,
      ubicacion:       ubicacion ?? null,
      meet_link,
      google_event_id,
      estado:          "agendada",
      notas:           notas ?? null,
    },
  })

  await prisma.notificacion.create({
    data: {
      user_id: alumno.user.id,
      tipo:    "cita_agendada",
      titulo:  "Nueva cita agendada",
      mensaje: `Tu coach agendó una cita: "${titulo}" el ${new Date(fecha_inicio).toLocaleDateString("es-EC")}`,
      link:    "/alumno/mi-agenda",
    },
  })

  return NextResponse.json({ cita }, { status: 201 })
}
