import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/admin/stats — stats para el dashboard del admin
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const en7dias   = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [coachesActivos, ingresosMes, porVencer, vencidos, actividadReciente] = await Promise.all([
    prisma.coach.count({ where: { estado_plan: "activo" } }),

    prisma.pago.aggregate({
      where: { fecha_pago: { gte: inicioMes } },
      _sum: { monto: true },
    }),

    prisma.coach.count({
      where: {
        estado_plan:       "activo",
        fecha_vencimiento: { gte: ahora, lte: en7dias },
      },
    }),

    prisma.coach.count({ where: { estado_plan: "solo_lectura" } }),

    prisma.historialPlan.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      include: {
        coach: { include: { user: { select: { nombre: true, apellido: true } } } },
        admin: { select: { nombre: true } },
      },
    }),
  ])

  return NextResponse.json({
    coachesActivos,
    ingresosMes:   Number(ingresosMes._sum.monto ?? 0),
    porVencer,
    vencidos,
    actividadReciente,
  })
}
