import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Users, Dumbbell, Calendar,
  Plus, FileDown, Lock,
  ChevronRight, Activity,
} from "lucide-react"
import { StatCard, Avatar, Badge } from "@/components/ui"
import { PlanFeatureService } from "@/lib/plan-features"
import type { Objetivo } from "@prisma/client"

// ─── Colores por objetivo ─────────────────────────────────────────────────────
const OBJETIVO_COLOR: Record<Objetivo, string> = {
  hipertrofia:   "var(--blue)",
  perdida_grasa: "var(--orange)",
  fuerza:        "var(--purple)",
  resistencia:   "var(--green)",
  general:       "var(--foreground-muted)",
}

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia:   "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza:        "Fuerza",
  resistencia:   "Resistencia",
  general:       "General",
}

// ─── Quick Action Item ─────────────────────────────────────────────────────────
function QuickAction({
  icono: Icono,
  label,
  href,
  bloqueado,
  color = "var(--blue)",
  bg = "var(--blue-bg)",
}: {
  icono: React.ElementType
  label: string
  href: string
  bloqueado?: boolean
  color?: string
  bg?: string
}) {
  return (
    <Link
      href={bloqueado ? "/coach/mi-plan" : href}
      className="relative flex flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all duration-150 hover:-translate-y-0.5"
      style={{
        background: "var(--background-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        opacity: bloqueado ? 0.7 : 1,
      }}
    >
      {bloqueado && (
        <span
          className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: "var(--orange-bg)" }}
        >
          <Lock size={10} style={{ color: "var(--orange)" }} />
        </span>
      )}
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: bg, color }}
      >
        <Icono size={20} />
      </span>
      <span className="text-xs font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
        {label}
      </span>
    </Link>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default async function CoachDashboardPage() {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const coachId = session.user.coachId

  const [coach, alumnos, rutinas, citasProximas, medicionesEstaSemana] = await Promise.all([
    prisma.coach.findUnique({
      where: { id: coachId },
      include: { user: true },
    }),
    prisma.alumno.findMany({
      where: { coach_id: coachId, activo: true },
      include: {
        user: { select: { nombre: true, apellido: true } },
        mediciones: { orderBy: { fecha: "desc" }, take: 1 },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    }),
    prisma.rutina.findMany({
      where: { coach_id: coachId, activa: true, alumno_id: { not: null }, deleted_at: null },
      include: { alumno: { include: { user: { select: { nombre: true, apellido: true } } } } },
      orderBy: { updated_at: "desc" },
      take: 4,
    }),
    prisma.cita.findMany({
      where: {
        coach_id: coachId,
        estado: "agendada",
        fecha_inicio: { gte: new Date() },
      },
      include: { alumno: { include: { user: { select: { nombre: true, apellido: true } } } } },
      orderBy: { fecha_inicio: "asc" },
      take: 3,
    }),
    prisma.medicion.count({
      where: {
        alumno: { coach_id: coachId },
        fecha: { gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  if (!coach) redirect("/login")

  const totalAlumnos = await prisma.alumno.count({ where: { coach_id: coachId, activo: true } })
  const limiteAlumnos = PlanFeatureService.limiteAlumnos(coach.plan_actual)
  const tieneMeet = PlanFeatureService.tieneFeature(coach.plan_actual, "meet_automatico")
  const tienePDF  = PlanFeatureService.tieneFeature(coach.plan_actual, "exportar_pdf_sin_marca")
  const nombreCoach = coach.user.nombre

  // Semanas activo
  const ahora = new Date()
  const semanas = coach.fecha_inicio_plan
    ? Math.floor((ahora.getTime() - new Date(coach.fecha_inicio_plan).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl px-7 py-6"
        style={{ background: "linear-gradient(135deg, #111827, #1e293b)" }}
      >
        {/* Orbe decorativo */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #2D7DF6, transparent)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #F97316, transparent)" }}
        />

        <div className="relative z-10">
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            Panel del coach
          </p>
          <h1
            className="text-2xl font-extrabold text-white mb-5"
            style={{ letterSpacing: "-0.02em" }}
          >
            ¡Hola, {nombreCoach}! 👋
          </h1>

          <div className="flex flex-wrap gap-6">
            {[
              { label: "Alumnos activos", valor: `${totalAlumnos}/${limiteAlumnos}` },
              { label: "Rutinas asignadas", valor: rutinas.length.toString() },
              { label: "Mediciones esta semana", valor: medicionesEstaSemana.toString() },
              ...(semanas !== null ? [{ label: "Semanas usando ProFit", valor: `${semanas}` }] : []),
            ].map(({ label, valor }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-white" style={{ letterSpacing: "-0.03em" }}>
                  {valor}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          titulo="Alumnos activos"
          valor={totalAlumnos}
          label={`de ${limiteAlumnos} en tu plan`}
          icono={Users}
          variante="blue"
        />
        <StatCard
          titulo="Rutinas asignadas"
          valor={rutinas.length}
          label="en curso"
          icono={Dumbbell}
          variante="green"
        />
        <StatCard
          titulo="Mediciones esta semana"
          valor={medicionesEstaSemana}
          label="registradas"
          icono={Activity}
          variante="orange"
        />
        <StatCard
          titulo="Próximas citas"
          valor={citasProximas.length}
          label="agendadas"
          icono={Calendar}
        />
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="section-title mb-3 text-base">Acciones rápidas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction href="/coach/alumnos/nuevo" icono={Plus} label="Nuevo alumno" />
          <QuickAction
            href="/coach/rutinas/nueva"
            icono={Dumbbell}
            label="Nueva rutina"
            color="var(--green)"
            bg="var(--green-bg)"
          />
          <QuickAction
            href="/coach/agenda/nueva"
            icono={Calendar}
            label="Agendar cita con Meet"
            bloqueado={!tieneMeet}
            color="var(--purple)"
            bg="var(--purple-bg)"
          />
          <QuickAction
            href="/coach/exportar"
            icono={FileDown}
            label="Exportar PDF"
            bloqueado={!tienePDF}
            color="var(--orange)"
            bg="var(--orange-bg)"
          />
        </div>
      </div>

      {/* ── Grids principales ─────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Alumnos recientes */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--background-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              Alumnos recientes
            </h3>
            <Link
              href="/coach/alumnos"
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--blue)" }}
            >
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>

          {alumnos.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Aún no tienes alumnos.{" "}
                <Link href="/coach/alumnos/nuevo" style={{ color: "var(--blue)", fontWeight: 600 }}>
                  Agrega el primero →
                </Link>
              </p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {alumnos.map((a) => {
                const ultimaMedicion = a.mediciones[0]
                return (
                  <li key={a.id}>
                    <Link
                      href={`/coach/alumnos/${a.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--background-hover)]"
                    >
                      <Avatar
                        nombre={a.user.nombre}
                        apellido={a.user.apellido}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                          {a.user.nombre} {a.user.apellido}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>
                          {a.objetivo ? OBJETIVO_LABEL[a.objetivo] : "Sin objetivo"}
                          {ultimaMedicion && ` · ${ultimaMedicion.peso_kg ? `${ultimaMedicion.peso_kg} kg` : ""}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.objetivo && (
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ background: OBJETIVO_COLOR[a.objetivo] }}
                          />
                        )}
                        <ChevronRight size={14} style={{ color: "var(--foreground-subtle)" }} />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Columna derecha: Rutinas + Citas */}
        <div className="flex flex-col gap-5">

          {/* Rutinas recientes */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--background-card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Rutinas asignadas
              </h3>
              <Link
                href="/coach/rutinas"
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--blue)" }}
              >
                Ver todas <ChevronRight size={14} />
              </Link>
            </div>

            {rutinas.length === 0 ? (
              <p className="px-5 py-6 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
                Sin rutinas asignadas aún
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {rutinas.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/coach/rutinas/${r.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--background-hover)]"
                    >
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: r.objetivo ? `${OBJETIVO_COLOR[r.objetivo]}20` : "var(--blue-bg)",
                          color: r.objetivo ? OBJETIVO_COLOR[r.objetivo] : "var(--blue)",
                        }}
                      >
                        <Dumbbell size={14} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                          {r.nombre}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>
                          {r.alumno?.user.nombre} {r.alumno?.user.apellido}
                        </p>
                      </div>
                      <ChevronRight size={14} style={{ color: "var(--foreground-subtle)" }} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Próximas citas */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--background-card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Próximas citas
              </h3>
              <Link
                href="/coach/agenda"
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--blue)" }}
              >
                Ver agenda <ChevronRight size={14} />
              </Link>
            </div>

            {citasProximas.length === 0 ? (
              <p className="px-5 py-6 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
                Sin citas próximas
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {citasProximas.map((c) => {
                  const fecha = new Date(c.fecha_inicio)
                  const dia = fecha.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })
                  const hora = fecha.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
                  return (
                    <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <div
                        className="flex flex-col items-center justify-center h-10 w-10 rounded-xl flex-shrink-0"
                        style={{ background: "var(--purple-bg)" }}
                      >
                        <span className="text-xs font-bold" style={{ color: "var(--purple)", lineHeight: 1 }}>
                          {fecha.getDate()}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--purple)" }}>
                          {fecha.toLocaleDateString("es-EC", { month: "short" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                          {c.titulo}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>
                          {hora} · {c.alumno.user.nombre} {c.alumno.user.apellido}
                        </p>
                      </div>
                      <Badge variant={c.modalidad === "online" ? "blue" : "neutral"} dot>
                        {c.modalidad === "online" ? "Online" : "Presencial"}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

        </div>
      </div>

      {/* ── Barra de uso del plan ──────────────────────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-4"
        style={{
          background: "var(--background-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Uso del plan
            </span>
            <Badge variant={coach.plan_actual === "gratis" ? "plan-gratis" : "plan-inicial"}>
              {PlanFeatureService.getNombrePlan(coach.plan_actual)}
            </Badge>
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>
            {totalAlumnos} / {limiteAlumnos} alumnos
          </span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((totalAlumnos / limiteAlumnos) * 100, 100)}%`,
              background: totalAlumnos >= limiteAlumnos
                ? "var(--red)"
                : totalAlumnos >= limiteAlumnos * 0.8
                ? "var(--orange)"
                : "var(--blue)",
            }}
          />
        </div>
        {totalAlumnos >= limiteAlumnos && (
          <p className="mt-2 text-xs font-medium" style={{ color: "var(--orange)" }}>
            Alcanzaste el límite de alumnos.{" "}
            <Link href="/coach/mi-plan" style={{ color: "var(--blue)", fontWeight: 700 }}>
              Actualiza tu plan →
            </Link>
          </p>
        )}
      </div>

    </div>
  )
}
