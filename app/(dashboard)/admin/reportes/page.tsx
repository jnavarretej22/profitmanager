import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { FileText, DollarSign, Users, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/ui"

export default async function AdminReportesPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioAnio = new Date(ahora.getFullYear(), 0, 1)

  const [
    ingresosMes, ingresosAnio,
    coachesPorPlan, coachesPorEstado,
    pagosPorMetodo, ultimosPagos,
  ] = await Promise.all([
    prisma.pago.aggregate({ where: { fecha_pago: { gte: inicioMes } }, _sum: { monto: true }, _count: true }),
    prisma.pago.aggregate({ where: { fecha_pago: { gte: inicioAnio } }, _sum: { monto: true }, _count: true }),

    prisma.coach.groupBy({ by: ["plan_actual"], _count: true }),
    prisma.coach.groupBy({ by: ["estado_plan"], _count: true }),

    prisma.pago.groupBy({ by: ["metodo"], _sum: { monto: true }, _count: true }),

    prisma.pago.findMany({
      take: 10,
      orderBy: { fecha_pago: "desc" },
      include: {
        coach: { include: { user: { select: { nombre: true, apellido: true } } } },
        registrador: { select: { nombre: true } },
      },
    }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Reportes</h1>
          <p className="section-subtitle">Ingresos y métricas de la plataforma</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/admin/reportes/csv" download className="btn-secondary">
          <FileText size={15} /> Exportar coaches CSV
        </a>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard titulo="Ingresos del mes"  valor={`$${Number(ingresosMes._sum.monto ?? 0).toFixed(2)}`}  icono={DollarSign}  variante="green" label={`${ingresosMes._count} pagos`} />
        <StatCard titulo="Ingresos del año"  valor={`$${Number(ingresosAnio._sum.monto ?? 0).toFixed(2)}`} icono={TrendingUp}  variante="blue"  label={`${ingresosAnio._count} pagos`} />
        <StatCard titulo="Coaches plan Inicial" valor={(coachesPorPlan.find((p) => p.plan_actual === "inicial")?._count ?? 0).toString()} icono={Users} variante="orange" />
        <StatCard titulo="Coaches plan Gratis"  valor={(coachesPorPlan.find((p) => p.plan_actual === "gratis")?._count  ?? 0).toString()} icono={Users} variante="neutral" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Coaches por estado */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Coaches por estado</h2>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {coachesPorEstado.map((e) => (
              <li key={e.estado_plan} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm capitalize" style={{ color: "var(--foreground-muted)" }}>
                  {e.estado_plan === "activo" ? "Activos" : e.estado_plan === "solo_lectura" ? "Solo lectura (vencidos)" : e.estado_plan}
                </span>
                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{e._count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ingresos por método de pago */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Ingresos por método</h2>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {pagosPorMetodo.map((m) => (
              <li key={m.metodo} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm capitalize" style={{ color: "var(--foreground-muted)" }}>{m.metodo}</span>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>${Number(m._sum.monto ?? 0).toFixed(2)}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-subtle)" }}>{m._count} pagos</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Últimos pagos */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Últimos pagos registrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Coach", "Monto", "Método", "Período", "Fecha pago", "Registrado por"].map((h) => (
                  <th key={h} className="py-3 px-5 text-left text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {ultimosPagos.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--background-hover)] transition-colors">
                  <td className="py-3 px-5 font-medium" style={{ color: "var(--foreground)" }}>
                    {p.coach.user.nombre} {p.coach.user.apellido}
                  </td>
                  <td className="py-3 px-5 font-bold" style={{ color: "var(--green)" }}>
                    ${Number(p.monto).toFixed(2)}
                  </td>
                  <td className="py-3 px-5 capitalize" style={{ color: "var(--foreground-muted)" }}>{p.metodo}</td>
                  <td className="py-3 px-5 text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {new Date(p.periodo_desde).toLocaleDateString("es-EC")} → {new Date(p.periodo_hasta).toLocaleDateString("es-EC")}
                  </td>
                  <td className="py-3 px-5 text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {new Date(p.fecha_pago).toLocaleDateString("es-EC")}
                  </td>
                  <td className="py-3 px-5 text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {p.registrador?.nombre ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
