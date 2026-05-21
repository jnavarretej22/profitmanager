import { NextRequest, NextResponse } from "next/server"
import { enviarEmail } from "@/lib/email"
import { prisma } from "@/lib/db"
import { PlanFeatureService } from "@/lib/plan-features"

// GET /api/cron/vencimientos
// Protegido con CRON_SECRET en el header Authorization
// Configurado en vercel.json para correr diariamente a las 06:00 UTC
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const ahora = new Date()

  // ── Expirar rutinas cuya fecha_fin ya pasó ────────────────────────────────
  const hoyFecha = new Date(ahora.toISOString().split("T")[0] + "T00:00:00.000Z")
  await prisma.rutina.updateMany({
    where: {
      activa:    true,
      alumno_id: { not: null },
      fecha_fin: { lt: hoyFecha },
    },
    data: { activa: false },
  })

  // ── Expirar planes alimenticios cuya fecha_fin ya pasó ───────────────────
  await prisma.planAlimenticio.updateMany({
    where: {
      activo:    true,
      alumno_id: { not: null },
      fecha_fin: { lt: hoyFecha },
    },
    data: { activo: false },
  })

  // Período de gracia: 3 días después del vencimiento
  const limiteGracia = new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000)

  // Coaches activos cuyo vencimiento + 3 días ya pasó
  const coachesPorVencer = await prisma.coach.findMany({
    where: {
      estado_plan:       "activo",
      fecha_vencimiento: { lt: limiteGracia },
    },
    select: {
      id: true,
      plan_actual: true,
      fecha_vencimiento: true,
      user_id: true,
      user: { select: { nombre: true, apellido: true } },
    },
  })

  const resultados: { coachId: string; accion: string }[] = []

  for (const coach of coachesPorVencer) {
    try {
      // 1. Pasar a solo_lectura
      await prisma.coach.update({
        where: { id: coach.id },
        data: { estado_plan: "solo_lectura" },
      })

      // 2. El archivado de alumnos SOLO ocurre en downgrade explícito a plan Gratis
      // (cuando admin registra un pago que cambia plan_actual a "gratis").
      // Al vencer el plan Inicial, el coach pasa a solo_lectura PERO sigue siendo "inicial"
      // en la BD — sus alumnos permanecen visibles en solo lectura. No se archiva aquí.

      // 3. Log en historial_planes (cambiado_por = null → SISTEMA)
      await prisma.historialPlan.create({
        data: {
          coach_id:                   coach.id,
          plan_anterior:              coach.plan_actual,
          plan_nuevo:                 coach.plan_actual,
          estado_anterior:            "activo",
          estado_nuevo:               "solo_lectura",
          fecha_vencimiento_anterior: coach.fecha_vencimiento,
          fecha_vencimiento_nueva:    coach.fecha_vencimiento,
          cambiado_por:               null,
          motivo:                     `Plan vencido automáticamente el ${ahora.toISOString().split("T")[0]}. Período de gracia de 3 días superado.`,
        },
      })

      // 4. Notificación in-app al coach
      await prisma.notificacion.create({
        data: {
          user_id: coach.user_id,
          tipo:    "vencimiento",
          titulo:  "Tu plan ha vencido",
          mensaje: `Tu plan venció y tu cuenta está en modo solo lectura. Contacta a soporte para renovar.`,
          link:    "/coach/mi-plan",
        },
      })

      resultados.push({ coachId: coach.id, accion: "solo_lectura" })
    } catch (err) {
      console.error(`Error procesando coach ${coach.id}:`, err)
      resultados.push({ coachId: coach.id, accion: "error" })
    }
  }

  // Notificaciones preventivas: 15, 7, 3, 1 días antes del vencimiento
  const DIAS_AVISO = [15, 7, 3, 1]
  for (const dias of DIAS_AVISO) {
    const desdeFecha = new Date(ahora.getTime() + dias * 24 * 60 * 60 * 1000)
    desdeFecha.setHours(0, 0, 0, 0)
    const hastaFecha = new Date(desdeFecha.getTime() + 24 * 60 * 60 * 1000)

    const proximos = await prisma.coach.findMany({
      where: {
        estado_plan:       "activo",
        fecha_vencimiento: { gte: desdeFecha, lt: hastaFecha },
      },
      select: { user_id: true, fecha_vencimiento: true },
    })

    for (const c of proximos) {
      // Verificar que no haya ya una notificación similar hoy para este usuario
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
      const mañana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000)

      const yaNotificado = await prisma.notificacion.count({
        where: {
          user_id:    c.user_id,
          tipo:       "vencimiento_proximo",
          created_at: { gte: hoy, lt: mañana },
        },
      })
      if (yaNotificado > 0) continue

      await prisma.notificacion.create({
        data: {
          user_id: c.user_id,
          tipo:    "vencimiento_proximo",
          titulo:  `Tu plan vence en ${dias} día${dias > 1 ? "s" : ""}`,
          mensaje: `Recuerda renovar tu plan antes del ${c.fecha_vencimiento?.toLocaleDateString("es-EC")} para no perder acceso.`,
          link:    "/coach/mi-plan",
        },
      })

      // Email de aviso (no en período de gracia — que aún no aplica aquí, esto es aviso previo)
      const coachUser = await prisma.user.findUnique({
        where: { id: c.user_id },
        select: { nombre: true, email: true },
      })
      if (coachUser && c.fecha_vencimiento) {
        enviarEmail(coachUser.email, {
          tipo: "vencimiento-aviso",
          data: {
            nombre: coachUser.nombre,
            diasRestantes: dias,
            fechaVencimiento: c.fecha_vencimiento.toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" }),
          },
        }).catch(console.error)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    procesados: coachesPorVencer.length,
    resultados,
    ejecutadoEn: ahora.toISOString(),
  })
}
