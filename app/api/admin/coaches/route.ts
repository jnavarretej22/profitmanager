import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { enviarEmail } from "@/lib/email"

const crearSchema = z.object({
  nombre:       z.string().min(2).max(80),
  apellido:     z.string().min(2).max(80),
  email:        z.string().email(),
  telefono:     z.string().max(30).optional().nullable(),
  pais:         z.string().length(2).optional().nullable(),
  plan_actual:  z.enum(["gratis", "inicial"]).default("gratis"),
  periodicidad: z.enum(["mensual", "anual"]).optional().nullable(),
})

// GET /api/admin/coaches — listado de todos los coaches con stats
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const busqueda = searchParams.get("q") ?? ""
  const filtro   = searchParams.get("filtro") ?? "todos" // todos | inicial | gratis | por_vencer | vencidos

  const ahora = new Date()
  const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)

  const coaches = await prisma.coach.findMany({
    where: {
      user: {
        activo: true,
        ...(busqueda && {
          OR: [
            { nombre:   { contains: busqueda, mode: "insensitive" } },
            { apellido: { contains: busqueda, mode: "insensitive" } },
            { email:    { contains: busqueda, mode: "insensitive" } },
          ],
        }),
      },
      ...(filtro === "inicial"     && { plan_actual: "inicial" }),
      ...(filtro === "gratis"      && { plan_actual: "gratis" }),
      ...(filtro === "por_vencer"  && { fecha_vencimiento: { gte: ahora, lte: en7dias }, estado_plan: "activo" }),
      ...(filtro === "vencidos"    && { estado_plan: "solo_lectura" }),
    },
    include: {
      user:    { select: { nombre: true, apellido: true, email: true, pais: true, activo: true, ultimo_login: true } },
      alumnos: { where: { activo: true, deleted_at: null }, select: { id: true } },
      pagos:   { orderBy: { fecha_pago: "desc" }, take: 1, select: { fecha_pago: true, monto: true } },
    },
    orderBy: { created_at: "desc" },
  })

  return NextResponse.json({ coaches })
}

// POST /api/admin/coaches — crea un coach desde el panel admin
// Reusa el flujo de "primer acceso": password_hash = null → el coach crea su
// contraseña al ingresar a /login por primera vez (igual que un alumno nuevo).
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "DATOS_INVALIDOS", detalles: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data      = parsed.data
  const emailNorm = data.email.toLowerCase().trim()

  const yaExiste = await prisma.user.findUnique({ where: { email: emailNorm }, select: { id: true } })
  if (yaExiste) {
    return NextResponse.json(
      { error: "EMAIL_OCUPADO", mensaje: "Ya existe una cuenta con ese email." },
      { status: 409 }
    )
  }

  let fechaInicioPlan:   Date | null = null
  let fechaVencimiento:  Date | null = null
  let periodicidadFinal: "mensual" | "anual" | null = null

  if (data.plan_actual === "inicial") {
    if (!data.periodicidad) {
      return NextResponse.json(
        { error: "PERIODICIDAD_REQUERIDA", mensaje: "Debes seleccionar mensual o anual para plan Inicial." },
        { status: 400 }
      )
    }
    periodicidadFinal = data.periodicidad
    fechaInicioPlan   = new Date()
    fechaVencimiento  = new Date()
    if (data.periodicidad === "mensual") {
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1)
    } else {
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1)
    }
  }

  const coachCreado = await prisma.$transaction(async (tx) => {
    const nuevoUser = await tx.user.create({
      data: {
        email:            emailNorm,
        password_hash:    null,
        role:             "coach",
        nombre:           data.nombre.trim(),
        apellido:         data.apellido.trim(),
        telefono:         data.telefono?.trim() || null,
        pais:             data.pais ?? null,
        email_verificado: false,
        activo:           true,
      },
    })

    const nuevoCoach = await tx.coach.create({
      data: {
        user_id:           nuevoUser.id,
        plan_actual:       data.plan_actual,
        periodicidad:      periodicidadFinal,
        fecha_inicio_plan: fechaInicioPlan,
        fecha_vencimiento: fechaVencimiento,
        estado_plan:       "activo",
      },
    })

    if (data.plan_actual === "inicial") {
      await tx.historialPlan.create({
        data: {
          coach_id:                   nuevoCoach.id,
          plan_anterior:              "gratis",
          plan_nuevo:                 "inicial",
          estado_anterior:            "activo",
          estado_nuevo:               "activo",
          fecha_vencimiento_anterior: null,
          fecha_vencimiento_nueva:    fechaVencimiento,
          cambiado_por:               session.user.id,
          motivo:                     "Coach creado por admin con plan Inicial",
        },
      })
    }

    return { user: nuevoUser, coach: nuevoCoach }
  })

  const baseUrl     = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const emailResult = await enviarEmail(emailNorm, {
    tipo: "bienvenida-coach",
    data: {
      nombre:    data.nombre,
      email:     emailNorm,
      linkLogin: `${baseUrl}/login`,
    },
  })
  if (!emailResult.ok) {
    console.error("[admin/coaches] No se pudo enviar email de bienvenida a", emailNorm, "—", emailResult.error)
  }

  // emailEnviado permite al admin saber si necesita comunicar credenciales manualmente
  return NextResponse.json({ ok: true, coach_id: coachCreado.coach.id, emailEnviado: emailResult.ok })
}
