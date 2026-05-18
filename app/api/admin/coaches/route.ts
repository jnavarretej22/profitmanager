import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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
