import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { Users, CreditCard, History, ChevronLeft, UserCheck, UserX } from "lucide-react"
import Link from "next/link"
import { Avatar, Badge } from "@/components/ui"
import { PlanFeatureService } from "@/lib/plan-features"
import { AdminCoachAcciones } from "./AdminCoachAcciones"
import { CambiarPlanModal } from "./CambiarPlanModal"

export default async function AdminCoachDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

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
        include: { admin: { select: { nombre: true } } },
        orderBy: { created_at: "desc" },
        take: 15,
      },
    },
  })

  if (!coach) notFound()

  const limite = PlanFeatureService.limiteAlumnos(coach.plan_actual)
  const alumnosActivos = coach.alumnos.filter((a) => a.activo)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <Link href="/admin/coaches" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>
        <ChevronLeft size={15} /> Volver a coaches
      </Link>

      {/* Header del coach */}
      <div
        className="rounded-2xl p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-center gap-4">
          <Avatar nombre={coach.user.nombre} apellido={coach.user.apellido} size="lg" />
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-extrabold" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                {coach.user.nombre} {coach.user.apellido}
              </h1>
              <Badge variant={coach.user.activo ? "success" : "neutral"} dot>
                {coach.user.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{coach.user.email}</p>
            {coach.user.telefono && <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{coach.user.telefono}</p>}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant={coach.plan_actual === "inicial" ? "plan-inicial" : "plan-gratis"}>
                {PlanFeatureService.getNombrePlan(coach.plan_actual)}
              </Badge>
              <Badge variant={coach.estado_plan === "activo" ? "success" : "danger"} dot>
                {coach.estado_plan === "activo" ? "Activo" : "Solo lectura"}
              </Badge>
              {coach.fecha_vencimiento && (
                <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                  Vence: {new Date(coach.fecha_vencimiento).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-shrink-0">
          <CambiarPlanModal
            coachId={coach.id}
            planActual={coach.plan_actual}
            estadoActual={coach.estado_plan}
            fechaVencimiento={coach.fecha_vencimiento ? coach.fecha_vencimiento.toISOString() : null}
          />
          <AdminCoachAcciones coachId={coach.id} userActivo={coach.user.activo} estadoPlan={coach.estado_plan} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Alumnos */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Users size={16} style={{ color: "var(--blue)" }} />
              Alumnos ({alumnosActivos.length}/{limite})
            </h2>
          </div>
          {coach.alumnos.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>Sin alumnos registrados</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {coach.alumnos.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar nombre={a.user.nombre} apellido={a.user.apellido} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                      {a.user.nombre} {a.user.apellido}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>{a.user.email}</p>
                  </div>
                  {!a.activo && <Badge variant="neutral">Archivado</Badge>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Historial de pagos */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <CreditCard size={16} style={{ color: "var(--green)" }} />
              Historial de pagos
            </h2>
          </div>
          {coach.pagos.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>Sin pagos registrados</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {coach.pagos.map((p) => (
                <li key={p.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: "var(--green)" }}>${Number(p.monto).toFixed(2)} USD</span>
                    <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                      {new Date(p.fecha_pago).toLocaleDateString("es-EC")}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                    {p.metodo} · {new Date(p.periodo_desde).toLocaleDateString("es-EC")} → {new Date(p.periodo_hasta).toLocaleDateString("es-EC")}
                  </p>
                  {p.registrador && (
                    <p className="text-[10px]" style={{ color: "var(--foreground-subtle)" }}>
                      Registrado por {p.registrador.nombre} {p.registrador.apellido}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Historial de cambios de plan */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <History size={16} style={{ color: "var(--purple)" }} />
            Historial de cambios de plan
          </h2>
        </div>
        {coach.historial_planes.length === 0 ? (
          <p className="py-6 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>Sin historial</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {coach.historial_planes.map((h) => (
              <li key={h.id} className="px-5 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                    {h.plan_anterior} → {h.plan_nuevo}
                  </span>
                  {h.estado_anterior !== h.estado_nuevo && (
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      ({h.estado_anterior} → {h.estado_nuevo})
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "var(--foreground-subtle)" }}>
                    {new Date(h.created_at).toLocaleDateString("es-EC")}
                  </span>
                </div>
                {h.motivo && <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{h.motivo}</p>}
                <p className="text-[10px]" style={{ color: "var(--foreground-subtle)" }}>
                  {h.admin ? `Por: ${h.admin.nombre}` : "Sistema automático"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
