import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Dumbbell, UtensilsCrossed, Calendar,
  ChevronRight, Clock, Video, BarChart2,
  TrendingUp, Activity, Flame,
} from "lucide-react"
import { Avatar, Badge, StatCard } from "@/components/ui"
import { PlanFeatureService } from "@/lib/plan-features"
import { GraficaProgreso } from "@/components/domain/GraficaProgreso"
import { CalendarioRutina } from "@/components/domain/CalendarioRutina"
import type { Objetivo } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia:   "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza:        "Fuerza",
  resistencia:   "Resistencia",
  general:       "General",
}

const DIAS_LABEL: Record<string, string> = {
  lunes: "Lun", martes: "Mar", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom",
}

const DIA_HOY: Record<number, string> = {
  1: "lunes", 2: "martes", 3: "miercoles", 4: "jueves",
  5: "viernes", 6: "sabado", 0: "domingo",
}

export default async function AlumnoDashboardPage() {
  const session = await auth()
  if (!session?.user.alumnoId) redirect("/login")

  const alumno = await prisma.alumno.findUnique({
    where: { id: session.user.alumnoId },
    include: {
      user: { select: { nombre: true, apellido: true, email: true } },
      coach: {
        select: {
          plan_actual: true,
          user: { select: { nombre: true, apellido: true } },
        },
      },
      mediciones: { orderBy: { fecha: "desc" }, take: 5 },
      rutinas: {
        where: { activa: true, deleted_at: null },
        include: {
          dias: {
            orderBy: { orden: "asc" },
            include: { ejercicios: { orderBy: { orden: "asc" } } },
          },
        },
        orderBy: { created_at: "desc" },
      },
      planes_alimenticios: {
        where: { activo: true, deleted_at: null },
        include: {
          dias: {
            orderBy: { orden: "asc" },
            include: { comidas: { orderBy: { orden: "asc" } } },
          },
        },
        take: 1,
      },
      citas: {
        where: { estado: "agendada", fecha_inicio: { gte: new Date() }, deleted_at: null },
        orderBy: { fecha_inicio: "asc" },
        take: 1,
      },
    },
  })

  if (!alumno) redirect("/login")

  const rutinas = alumno.rutinas
  const rutina = rutinas[0] ?? null
  const plan = alumno.planes_alimenticios[0] ?? null
  const proximaCita = alumno.citas[0] ?? null
  const ultimaMedicion = alumno.mediciones[0] ?? null
  const tieneGraficas = PlanFeatureService.tieneFeature(alumno.coach.plan_actual, "graficas_progreso")

  // Streak: días consecutivos con al menos una sesión completada,
  // contados desde hoy o ayer (no se rompe si todavía no entrena hoy).
  const logsCompletadas = await prisma.sesionRutinaLog.findMany({
    where:    { alumno_id: alumno.id, estado: "completada" },
    select:   { fecha: true },
    orderBy:  { fecha: "desc" },
    take:     365,
  })
  const fechasCompletadas = new Set(
    logsCompletadas.map((l) => l.fecha.toISOString().slice(0, 10)),
  )
  let streak = 0
  {
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    const hoyStr = cursor.toISOString().slice(0, 10)
    // Si hoy aún no completó, empezar a contar desde ayer (no rompe la racha)
    if (!fechasCompletadas.has(hoyStr)) {
      cursor.setDate(cursor.getDate() - 1)
    }
    while (fechasCompletadas.has(cursor.toISOString().slice(0, 10))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
  }
  const entrenadoHoy = fechasCompletadas.has(new Date().toISOString().slice(0, 10))

  const ahora = new Date()
  const semanas = alumno.fecha_inicio
    ? Math.floor((ahora.getTime() - new Date(alumno.fecha_inicio).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0

  const diaHoy = DIA_HOY[ahora.getDay()]
  // Buscar entrenamiento de hoy en cualquier rutina activa
  const diaHoyData = rutinas
    .map((r) => r.dias.find((d) => d.dia_semana === diaHoy && !d.es_descanso))
    .find((d): d is NonNullable<typeof d> => !!d) ?? null
  const tieneEntrenoHoy = !!diaHoyData

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Profile Banner ──────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-6"
        style={{ background: "linear-gradient(135deg, #111827, #1e293b)" }}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #F97316, transparent)" }}
        />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar nombre={alumno.user.nombre} apellido={alumno.user.apellido} size="lg" />

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1
                className="text-xl font-extrabold text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                {alumno.user.nombre} {alumno.user.apellido}
              </h1>
              <Badge variant={alumno.activo ? "success" : "neutral"} dot>
                {alumno.activo ? "Activo" : "Archivado"}
              </Badge>
              {alumno.objetivo && (
                <Badge variant="orange">{OBJETIVO_LABEL[alumno.objetivo]}</Badge>
              )}
            </div>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
              Coach: {alumno.coach.user.nombre} {alumno.coach.user.apellido}
            </p>

            <div className="flex flex-wrap gap-5 items-center">
              {streak > 0 && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "rgba(249,115,22,0.18)", border: "1px solid rgba(249,115,22,0.35)" }}
                  title={entrenadoHoy ? "Racha en curso" : "No rompas la racha: entrena hoy"}
                >
                  <Flame size={18} style={{ color: "#FB923C" }} />
                  <div>
                    <p className="text-xl font-extrabold text-white leading-none" style={{ letterSpacing: "-0.02em" }}>
                      {streak}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {streak === 1 ? "día seguido" : "días seguidos"}
                    </p>
                  </div>
                </div>
              )}
              {[
                { label: "Semanas activo", valor: semanas.toString() },
                { label: "Mediciones", valor: alumno.mediciones.length.toString() },
                ...(tieneEntrenoHoy && !entrenadoHoy
                  ? [{ label: "Hoy es día de entrenamiento 🔥", valor: "" }]
                  : []),
              ].map(({ label, valor }) => (
                <div key={label}>
                  {valor && (
                    <p className="text-2xl font-extrabold text-white" style={{ letterSpacing: "-0.03em" }}>
                      {valor}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          titulo="Peso actual"
          valor={ultimaMedicion?.peso_kg ? `${Number(ultimaMedicion.peso_kg).toFixed(1)} kg` : "—"}
          label="última medición"
          icono={TrendingUp}
          variante="blue"
        />
        <StatCard
          titulo="Cintura"
          valor={ultimaMedicion?.cintura_cm ? `${Number(ultimaMedicion.cintura_cm).toFixed(1)} cm` : "—"}
          label="última medición"
          icono={Activity}
          variante="orange"
        />
        <StatCard
          titulo="% Grasa"
          valor={ultimaMedicion?.porcentaje_grasa ? `${Number(ultimaMedicion.porcentaje_grasa).toFixed(1)}%` : "—"}
          label="última medición"
          icono={BarChart2}
          variante="green"
        />
      </div>

      {/* ── Calendario de entrenamiento + comidas ─────────── */}
      <CalendarioRutina
        rutina={rutina ? {
          id:               rutina.id,
          nombre:           rutina.nombre,
          objetivo:         rutina.objetivo ?? "general",
          duracion_minutos: rutina.duracion_minutos,
          fecha_fin:        rutina.fecha_fin?.toISOString().split("T")[0] ?? null,
          dias:             rutina.dias.map((d) => ({
            dia_semana:  d.dia_semana,
            nombre_foco: d.nombre_foco,
            es_descanso: d.es_descanso,
            ejercicios:  d.ejercicios.map((e) => ({
              nombre:            e.nombre,
              series:            e.series,
              repeticiones:      e.repeticiones,
              descanso_segundos: e.descanso_segundos,
              rpe:               e.rpe,
              notas:             e.notas,
              orden:             e.orden,
            })),
          })),
        } : null}
        plan={plan ? {
          id:        plan.id,
          nombre:    plan.nombre,
          fecha_fin: plan.fecha_fin?.toISOString().split("T")[0] ?? null,
          dias:      plan.dias.map((d) => ({
            dia_semana: d.dia_semana,
            es_libre:   d.es_libre,
            comidas:    d.comidas.map((c) => ({
              momento:       c.momento,
              hora_sugerida: c.hora_sugerida
                ? new Date(c.hora_sugerida).toTimeString().slice(0, 5)
                : null,
              descripcion:   c.descripcion,
              calorias:      c.calorias,
            })),
          })),
        } : null}
      />

      {/* ── Grid principal ──────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Rutina actual */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Rutina actual</h2>
              {rutinas.length > 1 && (
                <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5" style={{ background: "var(--blue-bg)", color: "var(--blue)" }}>
                  +{rutinas.length - 1} más
                </span>
              )}
            </div>
            <Link href="/alumno/mi-rutina" className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--blue)" }}>
              Ver {rutinas.length > 1 ? "todas" : "completa"} <ChevronRight size={14} />
            </Link>
          </div>

          {rutina ? (
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--blue-bg)" }}>
                  <Dumbbell size={20} style={{ color: "var(--blue)" }} />
                </span>
                <div>
                  <p className="font-bold" style={{ color: "var(--foreground)" }}>{rutina.nombre}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {rutina.dias.reduce((acc, d) => acc + d.ejercicios.length, 0)} ejercicios
                    {rutina.duracion_minutos ? ` · ${rutina.duracion_minutos} min` : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap mb-3">
                {["lunes","martes","miercoles","jueves","viernes","sabado","domingo"].map((d) => {
                  const diaData = rutina.dias.find((x) => x.dia_semana === d)
                  const activo = !!diaData && !diaData.es_descanso
                  return (
                    <span
                      key={d}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: activo
                          ? d === diaHoy ? "var(--orange)" : "var(--blue)"
                          : "var(--border)",
                        color: activo ? "white" : "var(--foreground-subtle)",
                      }}
                    >
                      {DIAS_LABEL[d][0]}
                    </span>
                  )
                })}
              </div>
              {tieneEntrenoHoy && diaHoyData && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: "var(--orange-bg)" }}
                >
                  <span className="text-lg">🔥</span>
                  <p className="text-xs font-semibold" style={{ color: "var(--orange)" }}>
                    ¡Hoy toca entrenar! Primer ejercicio: {diaHoyData.ejercicios[0]?.nombre ?? "—"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <Dumbbell size={28} className="mx-auto mb-2" style={{ color: "var(--foreground-subtle)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Sin rutina asignada</p>
              <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                Tu coach te asignará una rutina pronto
              </p>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-5">

          {/* Próxima cita */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Próxima reunión</h2>
              <Link href="/alumno/mi-agenda" className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--blue)" }}>
                Ver agenda <ChevronRight size={14} />
              </Link>
            </div>

            {proximaCita ? (
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="flex flex-col items-center justify-center h-12 w-12 rounded-xl flex-shrink-0"
                    style={{ background: "var(--purple-bg)" }}
                  >
                    <span className="text-base font-extrabold" style={{ color: "var(--purple)", lineHeight: 1 }}>
                      {new Date(proximaCita.fecha_inicio).getDate()}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--purple)" }}>
                      {new Date(proximaCita.fecha_inicio).toLocaleDateString("es-EC", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{proximaCita.titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                      <Clock size={11} className="inline mr-1" />
                      {new Date(proximaCita.fecha_inicio).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {proximaCita.modalidad === "online" ? "Online" : "Presencial"}
                    </p>
                  </div>
                </div>
                {proximaCita.meet_link && (
                  <a
                    href={proximaCita.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-4 w-full justify-center"
                    style={{ display: "flex" }}
                  >
                    <Video size={15} />
                    Unirme a la reunión
                  </a>
                )}
              </div>
            ) : (
              <div className="px-5 py-6 text-center">
                <Calendar size={24} className="mx-auto mb-2" style={{ color: "var(--foreground-subtle)" }} />
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Sin reuniones próximas</p>
              </div>
            )}
          </div>

          {/* Plan alimenticio resumen */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Plan alimenticio</h2>
              <Link href="/alumno/mi-plan-alimenticio" className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--blue)" }}>
                Ver completo <ChevronRight size={14} />
              </Link>
            </div>
            {plan ? (
              <div className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--green-bg)" }}>
                    <UtensilsCrossed size={18} style={{ color: "var(--green)" }} />
                  </span>
                  <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{plan.nombre}</p>
                </div>
              </div>
            ) : (
              <div className="px-5 py-6 text-center">
                <UtensilsCrossed size={24} className="mx-auto mb-2" style={{ color: "var(--foreground-subtle)" }} />
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Sin plan asignado</p>
              </div>
            )}
          </div>

          {/* Gráficas de progreso */}
          {tieneGraficas ? (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Progreso de peso</h2>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Últimas 6 semanas</p>
              </div>
              <div className="px-5 py-4">
                <GraficaProgreso alumnoId={session.user.alumnoId} tieneGraficas={true} mini />
                <Link href="/alumno/mi-progreso" className="btn-secondary text-xs py-1.5 px-3 mt-3 inline-flex">
                  Ver progreso completo →
                </Link>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  )
}

