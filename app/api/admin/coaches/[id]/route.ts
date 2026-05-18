import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { PlanFeatureService } from "@/lib/plan-features"

const patchSchema = z.object({
  plan_actual:       z.enum(["gratis", "inicial"]).optional(),
  periodicidad:      z.enum(["mensual", "anual"]).nullable().optional(),
  estado_plan:       z.enum(["activo", "vencido", "solo_lectura"]).optional(),
  fecha_vencimiento: z.string().nullable().optional(),  // ISO date string
  activo_user:       z.boolean().optional(),
  motivo:            z.string().optional(),
})

// GET /api/admin/coaches/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params

  const coach = await prisma.coach.findUnique({
    where: { id },
    include: {
      user: { select: { nombre: true, apellido: true, email: true, telefono: true, pais: true, activo: true, ultimo_login: true } },
      alumnos: {
        include: { user: { select: { nombre: true, apellido: true, email: true } } },
        orderBy: { created_at: "desc" },
      },
      pagos: {
        include: { registrador: { select: { nombre: true, apellido: true } } },
        orderBy: { fecha_pago: "desc" },
      },
      historial_planes: {
        include: { admin: { select: { nombre: true, apellido: true } } },
        orderBy: { created_at: "desc" },
      },
    },
  })

  if (!coach) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })
  return NextResponse.json({ coach })
}

// PATCH /api/admin/coaches/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "DATOS_INVALIDOS" }, { status: 400 })

  const { activo_user, motivo, ...coachData } = parsed.data

  const coachActual = await prisma.coach.findUnique({
    where: { id },
    select: {
      user_id:           true,
      plan_actual:       true,
      estado_plan:       true,
      fecha_vencimiento: true,
    },
  })
  if (!coachActual) return NextResponse.json({ error: "NO_ENCONTRADO" }, { status: 404 })

  const nuevoPlan    = coachData.plan_actual ?? coachActual.plan_actual
  const nuevoEstado  = coachData.estado_plan ?? coachActual.estado_plan
  const nuevaFecha   = coachData.fecha_vencimiento !== undefined
    ? (coachData.fecha_vencimiento ? new Date(coachData.fecha_vencimiento) : null)
    : coachActual.fecha_vencimiento

  const cambioPlan   = coachData.plan_actual !== undefined && coachData.plan_actual !== coachActual.plan_actual
  const cambioEstado = coachData.estado_plan !== undefined && coachData.estado_plan !== coachActual.estado_plan
  const cambioFecha  = coachData.fecha_vencimiento !== undefined

  // Actualizar coach
  await prisma.coach.update({
    where: { id },
    data: {
      plan_actual:       nuevoPlan,
      estado_plan:       nuevoEstado,
      fecha_vencimiento: nuevaFecha,
      ...(coachData.periodicidad !== undefined ? { periodicidad: coachData.periodicidad } : {}),
      ...(nuevoPlan === "inicial" && nuevaFecha && cambioPlan ? { fecha_inicio_plan: new Date() } : {}),
    },
  })

  // Actualizar estado del user si se pidió
  if (activo_user !== undefined) {
    await prisma.user.update({ where: { id: coachActual.user_id }, data: { activo: activo_user } })
  }

  // Si hay cambio de plan o estado, registrar en historial
  if (cambioPlan || cambioEstado || cambioFecha) {
    // Downgrade a gratis: archivar alumnos que excedan el límite
    if (cambioPlan && nuevoPlan === "gratis") {
      const limiteGratis = PlanFeatureService.limiteAlumnos("gratis")
      const alumnos = await prisma.alumno.findMany({
        where: { coach_id: id, activo: true, deleted_at: null },
        orderBy: { fecha_inicio: "asc" },
      })
      if (alumnos.length > limiteGratis) {
        const aArchivar = alumnos.slice(0, alumnos.length - limiteGratis).map((a) => a.id)
        await prisma.alumno.updateMany({
          where: { id: { in: aArchivar } },
          data: { activo: false },
        })
      }
    }

    await prisma.historialPlan.create({
      data: {
        coach_id:                   id,
        plan_anterior:              coachActual.plan_actual,
        plan_nuevo:                 nuevoPlan,
        estado_anterior:            coachActual.estado_plan,
        estado_nuevo:               nuevoEstado,
        fecha_vencimiento_anterior: coachActual.fecha_vencimiento,
        fecha_vencimiento_nueva:    nuevaFecha,
        cambiado_por:               session.user.id,
        motivo:                     motivo ?? "Cambio manual desde panel admin",
      },
    })
  }

  return NextResponse.json({ ok: true })
}
