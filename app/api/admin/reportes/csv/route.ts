import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/admin/reportes/csv
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "NO_AUTORIZADO" }, { status: 401 })
  }

  const coaches = await prisma.coach.findMany({
    include: {
      user:    { select: { nombre: true, apellido: true, email: true, pais: true } },
      alumnos: { where: { activo: true }, select: { id: true } },
      pagos:   { orderBy: { fecha_pago: "desc" }, take: 1 },
    },
    orderBy: { created_at: "desc" },
  })

  const encabezados = [
    "Nombre", "Apellido", "Email", "País", "Plan",
    "Estado", "Alumnos activos", "Fecha vencimiento",
    "Último pago (USD)", "Fecha último pago",
  ]

  const filas = coaches.map((c) => [
    c.user.nombre,
    c.user.apellido,
    c.user.email,
    c.user.pais ?? "",
    c.plan_actual,
    c.estado_plan,
    c.alumnos.length.toString(),
    c.fecha_vencimiento ? c.fecha_vencimiento.toISOString().split("T")[0] : "",
    c.pagos[0]?.monto?.toString() ?? "",
    c.pagos[0]?.fecha_pago ? c.pagos[0].fecha_pago.toISOString().split("T")[0] : "",
  ])

  const csv = [encabezados, ...filas]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="coaches-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
