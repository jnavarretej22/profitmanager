import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { LIMITES_ALUMNOS } from "@/lib/plan-features"
import { enviarEmail } from "@/lib/email"

const schema = z.discriminatedUnion("accion", [
  z.object({
    accion:       z.literal("aprobar"),
    nota_interna: z.string().max(500).optional(),
  }),
  z.object({
    accion:         z.literal("rechazar"),
    nota_interna:   z.string().max(500).optional(),
    notificar:      z.boolean().optional().default(true),
  }),
])

// PATCH /api/coach/solicitudes/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const solicitud = await prisma.solicitudInscripcion.findFirst({
    where: { id, coach_id: session.user.coachId ?? "" },
    select: { id: true, estado: true, nombre: true, email: true, telefono: true, coach_id: true },
  })

  if (!solicitud) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  if (solicitud.estado !== "pendiente") {
    return NextResponse.json({ error: "SOLICITUD_YA_PROCESADA", mensaje: "Esta solicitud ya fue procesada." }, { status: 409 })
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "DATOS_INVALIDOS", detalles: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const data = parsed.data

  // ── RECHAZAR ────────────────────────────────────────────────────
  if (data.accion === "rechazar") {
    const solActual = await prisma.solicitudInscripcion.update({
      where: { id },
      data:  { estado: "rechazada", nota_interna: data.nota_interna ?? null },
      select: { nombre: true, email: true, coach: { select: { user: { select: { nombre: true } } } } },
    })
    if (data.notificar !== false) {
      await enviarEmail(solActual.email, {
        tipo: "solicitud-rechazada",
        data: { nombreSolicitante: solActual.nombre, nombreCoach: solActual.coach.user.nombre },
      }).catch(() => {}) // no bloquear si falla
    }
    return NextResponse.json({ ok: true })
  }

  // ── APROBAR ─────────────────────────────────────────────────────
  const coach = await prisma.coach.findUnique({
    where: { id: solicitud.coach_id },
    select: {
      plan_actual: true,
      _count: { select: { alumnos: { where: { activo: true, deleted_at: null } } } },
    },
  })

  if (!coach) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  // Verificar cupo
  const limite  = LIMITES_ALUMNOS[coach.plan_actual]
  if (coach._count.alumnos >= limite) {
    return NextResponse.json(
      {
        error:   "PLAN_LIMIT_REACHED",
        mensaje: `No puedes aceptar esta solicitud: no tienes cupos disponibles en tu plan actual (${limite} alumnos máximo).`,
      },
      { status: 403 }
    )
  }

  // Verificar que el email no esté ya registrado
  const userExistente = await prisma.user.findUnique({
    where: { email: solicitud.email },
    select: { id: true, role: true },
  })

  if (userExistente) {
    return NextResponse.json(
      { error: "EMAIL_OCUPADO", mensaje: "El email de este solicitante ya tiene una cuenta en el sistema." },
      { status: 409 }
    )
  }

  // Separar nombre/apellido (heurístico: primer token = nombre, resto = apellido)
  const partes   = solicitud.nombre.trim().split(/\s+/)
  const nombre   = partes[0]
  const apellido = partes.slice(1).join(" ") || "-"

  // Crear user + alumno en una transacción. Sin password_hash: el alumno la
  // creará al ingresar por primera vez a /login (flujo de primer acceso).
  const alumnoCreado = await prisma.$transaction(async (tx) => {
    const nuevoUser = await tx.user.create({
      data: {
        email:            solicitud.email,
        password_hash:    null,
        role:             "alumno",
        nombre,
        apellido,
        telefono:         solicitud.telefono ?? null,
        email_verificado: false,
        activo:           true,
      },
    })

    const nuevoAlumno = await tx.alumno.create({
      data: {
        user_id:     nuevoUser.id,
        coach_id:    solicitud.coach_id,
        fecha_inicio:new Date(),
      },
    })

    await tx.solicitudInscripcion.update({
      where: { id },
      data:  {
        estado:       "aprobada",
        nota_interna: data.nota_interna ?? null,
        alumno_id:    nuevoAlumno.id,
      },
    })

    // Notificación de bienvenida al alumno
    await tx.notificacion.create({
      data: {
        user_id: nuevoUser.id,
        tipo:    "bienvenida",
        titulo:  "¡Bienvenido!",
        mensaje: "Tu coach ha aceptado tu solicitud. Ya puedes acceder a tu dashboard.",
        link:    "/alumno",
      },
    })

    return { alumno: nuevoAlumno, user: nuevoUser }
  })

  // Email de bienvenida (sin credenciales — el alumno activa su cuenta en /login).
  const baseUrl     = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const coachNombre = await prisma.user.findFirst({
    where:  { coach: { id: solicitud.coach_id } },
    select: { nombre: true },
  })
  await enviarEmail(solicitud.email, {
    tipo: "bienvenida-alumno",
    data: {
      nombreAlumno: nombre,
      nombreCoach:  coachNombre?.nombre ?? "Tu coach",
      email:        solicitud.email,
      linkLogin:    `${baseUrl}/login`,
    },
  }).catch(() => {}) // no bloquear si falla

  return NextResponse.json({
    ok:        true,
    alumno_id: alumnoCreado.alumno.id,
  })
}
