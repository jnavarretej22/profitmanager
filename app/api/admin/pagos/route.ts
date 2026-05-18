import { NextRequest, NextResponse } from "next/server"
import { enviarEmail } from "@/lib/email"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { PlanFeatureService } from "@/lib/plan-features"

const pagoSchema = z.object({
  coach_id:        z.string().uuid(),
  plan_nuevo:      z.enum(["gratis", "inicial"]),
  periodicidad:    z.enum(["mensual", "anual"]),
  monto:           z.number().positive(),
  metodo:          z.enum(["transferencia", "deposito", "otro"]),
  fecha_pago:      z.string().datetime(),
  periodo_desde:   z.string().datetime(),
  periodo_hasta:   z.string().datetime(),
  comprobante_url: z.string().url().optional().nullable(),
  notas:           z.string().optional().nullable(),
})

// GET /api/admin/pagos — listado de pagos
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const coachId = searchParams.get("coach_id")

  const pagos = await prisma.pago.findMany({
    where: { ...(coachId && { coach_id: coachId }) },
    include: {
      coach: { include: { user: { select: { nombre: true, apellido: true, email: true } } } },
      registrador: { select: { nombre: true, apellido: true } },
    },
    orderBy: { fecha_pago: "desc" },
  })

  return NextResponse.json({ pagos })
}

// POST /api/admin/pagos — registrar pago manual
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = pagoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "DATOS_INVALIDOS", detalle: parsed.error.flatten() }, { status: 400 })
  }

  const { coach_id, plan_nuevo, periodicidad, monto, metodo, fecha_pago, periodo_desde, periodo_hasta, comprobante_url, notas } = parsed.data

  const coach = await prisma.coach.findUnique({
    where: { id: coach_id },
    select: { id: true, plan_actual: true, estado_plan: true, fecha_vencimiento: true, user_id: true },
  })
  if (!coach) return NextResponse.json({ error: "COACH_NO_ENCONTRADO" }, { status: 404 })

  // Downgrade: si el nuevo plan es gratis y tiene más alumnos que el límite → archivar excedente
  if (plan_nuevo === "gratis") {
    const limite = PlanFeatureService.limiteAlumnos("gratis")
    const alumnos = await prisma.alumno.findMany({
      where: { coach_id: coach.id, activo: true },
      orderBy: { fecha_inicio: "asc" }, // los más antiguos primero → conservar los más recientes
    })
    if (alumnos.length > limite) {
      const aArchivar = alumnos.slice(0, alumnos.length - limite).map((a) => a.id)
      await prisma.alumno.updateMany({
        where: { id: { in: aArchivar } },
        data: { activo: false },
      })
    }
  }

  const [pago] = await prisma.$transaction([
    // 1. Registrar el pago
    prisma.pago.create({
      data: {
        coach_id,
        monto,
        moneda:          "USD",
        metodo,
        fecha_pago:      new Date(fecha_pago),
        periodo_desde:   new Date(periodo_desde),
        periodo_hasta:   new Date(periodo_hasta),
        comprobante_url: comprobante_url ?? null,
        registrado_por:  session.user.id,
        notas:           notas ?? null,
      },
    }),
    // 2. Actualizar el coach
    prisma.coach.update({
      where: { id: coach_id },
      data: {
        plan_actual:      plan_nuevo,
        periodicidad,
        fecha_inicio_plan: new Date(periodo_desde),
        fecha_vencimiento: new Date(periodo_hasta),
        estado_plan:      "activo",
      },
    }),
    // 3. Registrar en historial
    prisma.historialPlan.create({
      data: {
        coach_id,
        plan_anterior:               coach.plan_actual,
        plan_nuevo,
        estado_anterior:             coach.estado_plan,
        estado_nuevo:                "activo",
        fecha_vencimiento_anterior:  coach.fecha_vencimiento,
        fecha_vencimiento_nueva:     new Date(periodo_hasta),
        cambiado_por:                session.user.id,
        motivo:                      `Pago registrado por admin. Método: ${metodo}. Monto: $${monto} USD.`,
      },
    }),
    // 4. Notificación al coach
    prisma.notificacion.create({
      data: {
        user_id: coach.user_id,
        tipo:    "pago_confirmado",
        titulo:  "Pago confirmado",
        mensaje: `Tu plan ${plan_nuevo === "inicial" ? "Inicial" : "Gratis"} ha sido activado hasta el ${new Date(periodo_hasta).toLocaleDateString("es-EC")}`,
        link:    "/coach/mi-plan",
      },
    }),
  ])

  // Email al coach notificando plan activado
  const coachUser = await prisma.user.findUnique({
    where: { id: coach.user_id },
    select: { nombre: true, email: true },
  })
  if (coachUser) {
    enviarEmail(coachUser.email, {
      tipo: "plan-activado",
      data: {
        nombre: coachUser.nombre,
        plan: plan_nuevo,
        fechaVencimiento: new Date(periodo_hasta).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" }),
      },
    }).catch(console.error)
  }

  return NextResponse.json({ pago }, { status: 201 })
}
