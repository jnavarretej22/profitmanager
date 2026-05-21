import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui"
import { PlanFeatureService } from "@/lib/plan-features"
import {
  CheckCircle2, XCircle, Users, Calendar, CreditCard,
  Zap, Shield,
} from "lucide-react"
import { SolicitarUpgradeForm } from "./SolicitarUpgradeForm"

const FEATURES_TABLA = [
  { label: "Alumnos activos",                gratis: "Hasta 3",    inicial: "Hasta 10"   },
  { label: "Rutinas manuales",               gratis: true,         inicial: true          },
  { label: "Templates de rutinas",           gratis: false,        inicial: true          },
  { label: "Plan alimenticio",               gratis: "Genérico",   inicial: "Por objetivo"},
  { label: "Templates por objetivo",         gratis: false,        inicial: true          },
  { label: "Google Meet automático",         gratis: false,        inicial: true          },
  { label: "Gráficas de progreso",           gratis: false,        inicial: true          },
  { label: "Exportar PDF sin marca de agua", gratis: false,        inicial: true          },
  { label: "Marca de agua en vistas alumno", gratis: "Presente",   inicial: "Sin marca"   },
]

function CeldaFeature({ valor }: { valor: boolean | string }) {
  if (valor === true)  return <CheckCircle2 size={16} style={{ color: "var(--green)" }} />
  if (valor === false) return <XCircle      size={16} style={{ color: "var(--foreground-subtle)" }} />
  return <span className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>{valor}</span>
}

export default async function MiPlanPage() {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId },
    include: {
      user:   { select: { nombre: true, email: true } },
      pagos:  { orderBy: { fecha_pago: "desc" }, take: 10 },
    },
  })

  if (!coach) redirect("/login")

  const totalAlumnos = await prisma.alumno.count({
    where: { coach_id: coach.id, activo: true },
  })

  const limiteAlumnos = PlanFeatureService.limiteAlumnos(coach.plan_actual)
  const esInicial     = coach.plan_actual === "inicial"
  const diasRestantes = coach.fecha_vencimiento
    ? Math.ceil((new Date(coach.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const estadoColor = coach.estado_plan === "activo"       ? "var(--green)"
                    : coach.estado_plan === "solo_lectura" ? "var(--red)"
                    : "var(--orange)"

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Mi plan</h1>
        <p className="section-subtitle">Gestiona tu suscripción a ProFit Manager</p>
      </div>

      {/* Card plan actual */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                {esInicial ? "Plan Inicial" : "Plan Gratis"}
              </h2>
              <Badge variant={coach.estado_plan === "activo" ? "success" : "danger"} dot>
                {coach.estado_plan === "activo" ? "Activo" : coach.estado_plan === "solo_lectura" ? "Vencido" : "Inactivo"}
              </Badge>
            </div>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
              {esInicial
                ? `$15 USD/mes · ${coach.periodicidad === "anual" ? "Pago anual ($144 USD)" : "Pago mensual"}`
                : "Siempre gratis"}
            </p>
          </div>
          {esInicial && (
            <div className="text-right">
              <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>Vence el</p>
              <p className="text-base font-bold" style={{ color: estadoColor }}>
                {coach.fecha_vencimiento
                  ? new Date(coach.fecha_vencimiento).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </p>
              {diasRestantes !== null && (
                <p className="text-xs" style={{ color: diasRestantes <= 7 ? "var(--red)" : "var(--foreground-muted)" }}>
                  {diasRestantes > 0 ? `${diasRestantes} días restantes` : "Vencido"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Uso de alumnos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
              <Users size={14} />
              Alumnos activos
            </span>
            <span className="font-bold" style={{ color: "var(--foreground)" }}>
              {totalAlumnos} / {limiteAlumnos}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (totalAlumnos / limiteAlumnos) * 100)}%`,
                background: totalAlumnos >= limiteAlumnos ? "var(--red)" : "var(--blue)",
              }}
            />
          </div>
          {totalAlumnos >= limiteAlumnos && (
            <p className="text-xs" style={{ color: "var(--red)" }}>
              Límite alcanzado. Actualiza tu plan para agregar más alumnos.
            </p>
          )}
        </div>
      </div>

      {/* Comparativa de planes */}
      {!esInicial && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-bold" style={{ color: "var(--foreground)" }}>Comparativa de planes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="py-3 px-5 text-left text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>Funcionalidad</th>
                  <th className="py-3 px-5 text-center text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>Gratis</th>
                  <th className="py-3 px-5 text-center text-xs font-semibold" style={{ color: "var(--blue)" }}>Plan Inicial</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {FEATURES_TABLA.map((f) => (
                  <tr key={f.label} className="hover:bg-[var(--background-hover)] transition-colors">
                    <td className="py-3 px-5 text-sm" style={{ color: "var(--foreground)" }}>{f.label}</td>
                    <td className="py-3 px-5 text-center"><CeldaFeature valor={f.gratis} /></td>
                    <td className="py-3 px-5 text-center"><CeldaFeature valor={f.inicial} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Precio */}
          <div className="px-6 py-5 border-t" style={{ borderColor: "var(--border)", background: "var(--blue-bg)" }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold" style={{ color: "var(--blue)" }}>Plan Inicial</p>
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                  <strong>$15 USD/mes</strong> o <strong>$144 USD/año</strong>{" "}
                  <span style={{ color: "var(--green)" }}>(ahorro de $36)</span>
                </p>
              </div>
              <a href="#upgrade" className="btn-primary flex items-center gap-2">
                <Zap size={15} />
                Actualizar ahora
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de solicitud de upgrade */}
      {!esInicial && (
        <div id="upgrade">
          <SolicitarUpgradeForm coachNombre={coach.user.nombre} coachEmail={coach.user.email} />
        </div>
      )}

      {/* Si ya tiene plan Inicial, mostrar renovación */}
      {esInicial && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} style={{ color: "var(--blue)" }} />
            <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Renovar plan</p>
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
            Para renovar tu suscripción, realiza una transferencia bancaria y envíanos el comprobante.
          </p>
          <SolicitarUpgradeForm coachNombre={coach.user.nombre} coachEmail={coach.user.email} esRenovacion />
        </div>
      )}

      {/* Historial de pagos */}
      {coach.pagos.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <CreditCard size={15} style={{ color: "var(--blue)" }} />
              Historial de pagos
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {coach.pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    ${Number(p.monto).toFixed(2)} {p.moneda}
                  </p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {new Date(p.fecha_pago).toLocaleDateString("es-EC")} · {p.metodo}
                  </p>
                </div>
                <div className="text-right text-xs" style={{ color: "var(--foreground-muted)" }}>
                  <p>{new Date(p.periodo_desde).toLocaleDateString("es-EC")} →</p>
                  <p>{new Date(p.periodo_hasta).toLocaleDateString("es-EC")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
