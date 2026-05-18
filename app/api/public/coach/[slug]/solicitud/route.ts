import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { SLUGS_RESERVADOS } from "@/lib/slug"
import { LIMITES_ALUMNOS } from "@/lib/plan-features"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { enviarEmail } from "@/lib/email"
import { z } from "zod"

const schema = z.object({
  nombre:   z.string().min(2).max(150).trim(),
  email:    z.string().email().max(255).toLowerCase().trim(),
  telefono: z.string().max(30).trim().optional().nullable(),
  mensaje:  z.string().max(300).trim().optional().nullable(),
})

// GET /api/public/coach/[slug]/solicitud — verificar cupos disponibles
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (SLUGS_RESERVADOS.has(slug)) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  const coach = await prisma.coach.findUnique({
    where: { slug },
    select: {
      plan_actual:           true,
      perfil_publico_activo: true,
      _count: { select: { alumnos: { where: { activo: true, deleted_at: null } } } },
    },
  })

  if (!coach || !coach.perfil_publico_activo || coach.plan_actual !== "inicial") {
    return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  }

  const limite  = LIMITES_ALUMNOS[coach.plan_actual]
  const actuales = coach._count.alumnos
  const disponibles = Math.max(0, limite - actuales)

  return NextResponse.json({ cupos_disponibles: disponibles, limite, actuales })
}

// POST /api/public/coach/[slug]/solicitud — enviar solicitud de inscripción
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (SLUGS_RESERVADOS.has(slug)) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  // Rate limiting por IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const rl  = checkRateLimit(`solicitud:${ip}`, RATE_LIMITS.solicitud)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT", mensaje: "Demasiadas solicitudes. Intenta de nuevo en una hora." },
      { status: 429 }
    )
  }

  const coach = await prisma.coach.findUnique({
    where: { slug },
    select: {
      id:                    true,
      plan_actual:           true,
      perfil_publico_activo: true,
      user: { select: { nombre: true, email: true } },
      _count: { select: { alumnos: { where: { activo: true, deleted_at: null } } } },
    },
  })

  if (!coach || !coach.perfil_publico_activo || coach.plan_actual !== "inicial") {
    return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "DATOS_INVALIDOS", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { nombre, email, telefono, mensaje } = parsed.data

  // Verificar solicitud duplicada pendiente del mismo email a este coach
  const duplicada = await prisma.solicitudInscripcion.findFirst({
    where: { coach_id: coach.id, email, estado: "pendiente" },
    select: { id: true },
  })
  if (duplicada) {
    return NextResponse.json(
      { error: "SOLICITUD_DUPLICADA", mensaje: "Ya tienes una solicitud pendiente con este coach. Te contactaremos pronto." },
      { status: 409 }
    )
  }

  // Verificar que no sea ya alumno
  const yaAlumno = await prisma.alumno.findFirst({
    where: { coach_id: coach.id, user: { email }, deleted_at: null },
    select: { id: true },
  })
  if (yaAlumno) {
    return NextResponse.json(
      { error: "YA_ES_ALUMNO", mensaje: "Este correo ya está registrado como alumno de este coach." },
      { status: 409 }
    )
  }

  const solicitud = await prisma.solicitudInscripcion.create({
    data: { coach_id: coach.id, nombre, email, telefono: telefono ?? null, mensaje: mensaje ?? null, ip_origen: ip },
  })

  // Notificación in-app al coach
  const coachUser = await prisma.user.findFirst({ where: { coach: { id: coach.id } }, select: { id: true } })
  if (coachUser) {
    await prisma.notificacion.create({
      data: {
        user_id: coachUser.id,
        tipo:    "nueva_solicitud",
        titulo:  "Nueva solicitud de inscripción",
        mensaje: `${nombre} quiere ser tu alumno. Revisa la solicitud en tu dashboard.`,
        link:    "/coach/solicitudes",
      },
    })
  }

  // Emails: fire-and-forget — no bloqueamos la respuesta
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  enviarEmail(email, {
    tipo: "solicitud-recibida",
    data: { nombreSolicitante: nombre, nombreCoach: coach.user.nombre },
  }).catch(() => {})
  enviarEmail(coach.user.email, {
    tipo: "nueva-solicitud-coach",
    data: {
      nombreCoach:         coach.user.nombre,
      nombreSolicitante:   nombre,
      emailSolicitante:    email,
      telefonoSolicitante: telefono ?? null,
      mensaje:             mensaje ?? null,
      linkSolicitudes:     `${baseUrl}/coach/solicitudes`,
    },
  }).catch(() => {})

  return NextResponse.json({ ok: true, id: solicitud.id }, { status: 201 })
}
