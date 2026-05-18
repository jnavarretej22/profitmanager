import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Users, DollarSign, AlertTriangle, XCircle,
  ChevronRight, Plus, Bell, FileText,
} from "lucide-react"
import { StatCard, Badge, Avatar } from "@/components/ui"
import { PlanFeatureService } from "@/lib/plan-features"
import { RegistrarPagoModal } from "./RegistrarPagoModal"
import { AdminCoachesTable } from "./AdminCoachesTable"

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const sp = await searchParams
  const busqueda = sp.q ?? ""
  const filtro   = sp.filtro ?? "todos"

  const ahora   = new Date()
  const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const [coachesActivos, ingresosMes, porVencer, vencidos, coaches, actividadReciente] = await Promise.all([
    prisma.coach.count({ where: { estado_plan: "activo" } }),
    prisma.pago.aggregate({ where: { fecha_pago: { gte: inicioMes } }, _sum: { monto: true } }),
    prisma.coach.count({ where: { estado_plan: "activo", fecha_vencimiento: { gte: ahora, lte: en7dias } } }),
    prisma.coach.count({ where: { estado_plan: "solo_lectura" } }),

    prisma.coach.findMany({
      where: {
        user: busqueda ? {
          OR: [
            { nombre:   { contains: busqueda, mode: "insensitive" } },
            { apellido: { contains: busqueda, mode: "insensitive" } },
            { email:    { contains: busqueda, mode: "insensitive" } },
          ],
        } : undefined,
        ...(filtro === "inicial"    && { plan_actual: "inicial" }),
        ...(filtro === "gratis"     && { plan_actual: "gratis" }),
        ...(filtro === "por_vencer" && { fecha_vencimiento: { gte: ahora, lte: en7dias }, estado_plan: "activo" }),
        ...(filtro === "vencidos"   && { estado_plan: "solo_lectura" } as object),
      },
      include: {
        user:    { select: { nombre: true, apellido: true, email: true, pais: true, activo: true } },
        alumnos: { where: { activo: true, deleted_at: null }, select: { id: true } },
        pagos:   { orderBy: { fecha_pago: "desc" }, take: 1, select: { fecha_pago: true, monto: true } },
      },
      orderBy: { created_at: "desc" },
    }),

    prisma.historialPlan.findMany({
      take: 8,
      orderBy: { created_at: "desc" },
      include: {
        coach: { select: { user: { select: { nombre: true, apellido: true } } } },
        admin: { select: { nombre: true } },
      },
    }),
  ])

  const allCoaches = await prisma.coach.findMany({
    include: { user: { select: { nombre: true, apellido: true, email: true } } },
    orderBy: { user: { nombre: "asc" } },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Panel de administración</h1>
          <p className="section-subtitle">Gestión completa de coaches y cobros</p>
        </div>
        <div className="flex gap-2">
          <RegistrarPagoModal coaches={allCoaches.map((c) => ({ id: c.id, nombre: `${c.user.nombre} ${c.user.apellido}`, email: c.user.email }))} />
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/admin/reportes/csv" download className="btn-secondary text-sm">
            <FileText size={15} /> Exportar CSV
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard titulo="Coaches activos"    valor={coachesActivos.toString()} icono={Users}         variante="blue" />
        <StatCard titulo="Ingresos del mes"   valor={`$${Number(ingresosMes._sum.monto ?? 0).toFixed(0)}`} icono={DollarSign} variante="green" label="USD" />
        <StatCard titulo="Por vencer (7 días)" valor={porVencer.toString()}      icono={AlertTriangle}  variante="orange" />
        <StatCard titulo="Plan vencido"        valor={vencidos.toString()}        icono={XCircle}        variante="red" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Tabla de coaches (2/3) */}
        <div className="lg:col-span-2">
          <AdminCoachesTable coaches={coaches} busqueda={busqueda} filtro={filtro} />
        </div>

        {/* Actividad reciente (1/3) */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Actividad reciente</h2>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {actividadReciente.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>Sin actividad</li>
            ) : actividadReciente.map((h) => (
              <li key={h.id} className="px-5 py-3">
                <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                  {h.coach.user.nombre} {h.coach.user.apellido}
                </p>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  {h.plan_anterior} → {h.plan_nuevo}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-subtle)" }}>
                  {h.admin ? `Por: ${h.admin.nombre}` : "Sistema automático"}
                  {" · "}
                  {new Date(h.created_at).toLocaleDateString("es-EC")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
