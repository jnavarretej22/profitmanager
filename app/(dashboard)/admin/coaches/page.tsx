import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { AdminCoachesTable } from "../AdminCoachesTable"
import { RegistrarPagoModal } from "../RegistrarPagoModal"
import { CrearCoachModal } from "../CrearCoachModal"

export const metadata = { title: "Coaches" }

export default async function AdminCoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const sp = await searchParams
  const busqueda = sp.q ?? ""
  const filtro = sp.filtro ?? "todos"

  const ahora = new Date()
  const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [coaches, allCoaches] = await Promise.all([
    prisma.coach.findMany({
      where: {
        user: busqueda
          ? {
              OR: [
                { nombre: { contains: busqueda, mode: "insensitive" } },
                { apellido: { contains: busqueda, mode: "insensitive" } },
                { email: { contains: busqueda, mode: "insensitive" } },
              ],
            }
          : undefined,
        ...(filtro === "inicial" && { plan_actual: "inicial" }),
        ...(filtro === "gratis" && { plan_actual: "gratis" }),
        ...(filtro === "por_vencer" && {
          fecha_vencimiento: { gte: ahora, lte: en7dias },
          estado_plan: "activo",
        }),
        ...(filtro === "vencidos" && ({ estado_plan: "solo_lectura" } as object)),
      },
      include: {
        user: { select: { nombre: true, apellido: true, email: true, pais: true, activo: true } },
        alumnos: { where: { activo: true, deleted_at: null }, select: { id: true } },
        pagos: { orderBy: { fecha_pago: "desc" }, take: 1, select: { fecha_pago: true, monto: true } },
      },
      orderBy: { created_at: "desc" },
    }),

    prisma.coach.findMany({
      include: { user: { select: { nombre: true, apellido: true, email: true } } },
      orderBy: { user: { nombre: "asc" } },
    }),
  ])

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">Coaches</h1>
          <p className="section-subtitle">
            {coaches.length} coach{coaches.length !== 1 ? "es" : ""} encontrado{coaches.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <CrearCoachModal />
          <RegistrarPagoModal
            coaches={allCoaches.map((c) => ({
              id: c.id,
              nombre: `${c.user.nombre} ${c.user.apellido}`,
              email: c.user.email,
            }))}
          />
        </div>
      </div>

      <AdminCoachesTable
        coaches={coaches}
        busqueda={busqueda}
        filtro={filtro}
        basePath="/admin/coaches"
      />
    </div>
  )
}
