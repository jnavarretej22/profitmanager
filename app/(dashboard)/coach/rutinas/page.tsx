import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Dumbbell, ChevronRight, Users, BookOpen } from "lucide-react"
import { Badge, EmptyState } from "@/components/ui"
import { PlanFeatureService } from "@/lib/plan-features"
import { FiltrosRutinas } from "./FiltrosRutinas"
import type { Objetivo } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia:   "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza:        "Fuerza",
  resistencia:   "Resistencia",
  general:       "General",
}

const OBJETIVO_VARIANT = {
  hipertrofia:   "blue",
  perdida_grasa: "orange",
  fuerza:        "purple",
  resistencia:   "success",
  general:       "neutral",
} as const

const DIAS_CORTO: Record<string, string> = {
  lunes: "L", martes: "M", miercoles: "X", jueves: "J",
  viernes: "V", sabado: "S", domingo: "D",
}

export default async function RutinasPage({
  searchParams,
}: {
  searchParams: Promise<{ objetivo?: string; tipo?: string }>
}) {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const { objetivo, tipo } = await searchParams
  const coachId = session.user.coachId

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { plan_actual: true, estado_plan: true },
  })
  if (!coach) redirect("/login")

  const rutinas = await prisma.rutina.findMany({
    where: {
      coach_id: coachId,
      deleted_at: null,
      activa: true,
      ...(objetivo ? { objetivo: objetivo as Objetivo } : {}),
      ...(tipo === "template" ? { es_template: true } : tipo === "asignada" ? { es_template: false, alumno_id: { not: null } } : {}),
    },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { select: { id: true } } },
      },
      alumno: { include: { user: { select: { nombre: true, apellido: true } } } },
    },
    orderBy: { updated_at: "desc" },
  })

  const tieneTemplates = PlanFeatureService.tieneFeature(coach.plan_actual, "templates_rutinas")
  const esSoloLectura = coach.estado_plan === "solo_lectura"

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">Rutinas</h1>
          <p className="section-subtitle">Crea y asigna rutinas a tus alumnos</p>
        </div>
        {!esSoloLectura && (
          <Link href="/coach/rutinas/nueva" className="btn-primary">
            <Plus size={16} /> Nueva rutina
          </Link>
        )}
      </div>

      {/* Filtros */}
      <FiltrosRutinas />

      {/* Banner templates bloqueados */}
      {!tieneTemplates && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: "var(--blue-bg)", border: "1px solid var(--blue)22" }}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: "var(--blue)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--blue)" }}>
              Los templates de rutinas por objetivo están disponibles en el Plan Inicial.
            </p>
          </div>
          <Link href="/coach/mi-plan" className="btn-primary text-xs py-1.5 px-3">
            Conocer más
          </Link>
        </div>
      )}

      {/* Lista */}
      {rutinas.length === 0 ? (
        <EmptyState
          icono={Dumbbell}
          titulo="Sin rutinas"
          subtitulo="Crea tu primera rutina y asígnala a un alumno."
          cta={!esSoloLectura ? { label: "Nueva rutina", href: "/coach/rutinas/nueva" } : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rutinas.map((r) => {
            const diasEntrenamiento = r.dias.filter((d) => !d.es_descanso)
            const totalEjercicios = r.dias.reduce((acc, d) => acc + d.ejercicios.length, 0)
            return (
              <Link
                key={r.id}
                href={`/coach/rutinas/${r.id}`}
                className="group flex flex-col rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5"
                style={{
                  background: "var(--background-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <span
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--blue-bg)" }}
                  >
                    <Dumbbell size={18} style={{ color: "var(--blue)" }} />
                  </span>
                  <div className="flex items-center gap-1">
                    {r.es_template && <Badge variant="purple">Template</Badge>}
                    {r.objetivo && <Badge variant={OBJETIVO_VARIANT[r.objetivo]}>{OBJETIVO_LABEL[r.objetivo]}</Badge>}
                  </div>
                </div>

                <h3 className="text-sm font-bold mb-1 line-clamp-1" style={{ color: "var(--foreground)" }}>
                  {r.nombre}
                </h3>

                {/* Alumno asignado */}
                {r.alumno && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users size={12} style={{ color: "var(--foreground-subtle)" }} />
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {r.alumno.user.nombre} {r.alumno.user.apellido}
                    </span>
                  </div>
                )}

                {/* Días de la semana */}
                {r.dias.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {["lunes","martes","miercoles","jueves","viernes","sabado","domingo"].map((d) => {
                      const diaData = r.dias.find((x) => x.dia_semana === d)
                      const activo = !!diaData && !diaData.es_descanso
                      return (
                        <span
                          key={d}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{
                            background: activo ? "var(--blue)" : "var(--border)",
                            color: activo ? "white" : "var(--foreground-subtle)",
                          }}
                        >
                          {DIAS_CORTO[d]}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Footer */}
                <div
                  className="mt-auto flex items-center justify-between pt-3 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                    {diasEntrenamiento.length} día{diasEntrenamiento.length !== 1 ? "s" : ""} · {totalEjercicios} ejercicio{totalEjercicios !== 1 ? "s" : ""}
                    {r.duracion_minutos ? ` · ${r.duracion_minutos} min` : ""}
                  </span>
                  <ChevronRight size={14} style={{ color: "var(--foreground-subtle)" }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
