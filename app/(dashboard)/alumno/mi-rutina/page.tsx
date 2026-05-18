import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { Dumbbell, Clock } from "lucide-react"
import { ExportarPDFBtn } from "@/components/domain/ExportarPDFBtn"
import { Badge, EmptyState } from "@/components/ui"
import type { Objetivo } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: "Hipertrofia", perdida_grasa: "Pérdida de grasa",
  fuerza: "Fuerza", resistencia: "Resistencia", general: "General",
}

const DIAS_LABEL: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
  jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
}

export default async function MiRutinaPage() {
  const session = await auth()
  if (!session?.user.alumnoId) redirect("/login")

  const alumno = await prisma.alumno.findUnique({
    where: { id: session.user.alumnoId },
    include: {
      rutinas: {
        where: { activa: true, deleted_at: null },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
        take: 1,
      },
    },
  })

  const rutina = alumno?.rutinas[0] ?? null
  const dias = (rutina?.dias_semana as string[]) ?? []
  const diaHoy = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"][new Date().getDay()]

  if (!rutina) {
    return (
      <div className="animate-fade-in">
        <h1 className="section-title mb-2">Mi rutina</h1>
        <EmptyState
          icono={Dumbbell}
          titulo="Sin rutina asignada"
          subtitulo="Tu coach aún no te ha asignado una rutina. Espera a que lo haga."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Mi rutina</h1>
          <p className="section-subtitle">Vista completa de tu programa de entrenamiento</p>
        </div>
        {rutina && (
          <ExportarPDFBtn href={`/api/exportar/rutina/${rutina.id}`} label="Exportar PDF" />
        )}
      </div>

      {/* Card de rutina */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-start gap-4 mb-5">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--blue-bg)" }}>
            <Dumbbell size={22} style={{ color: "var(--blue)" }} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
              {rutina.nombre}
            </h2>
            {rutina.descripcion && (
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{rutina.descripcion}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-2">
          {rutina.objetivo && <Badge variant="blue">{OBJETIVO_LABEL[rutina.objetivo]}</Badge>}
          {rutina.duracion_minutos && (
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
              <Clock size={13} /> {rutina.duracion_minutos} min por sesión
            </span>
          )}
        </div>

        {/* Días de la semana */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground-subtle)" }}>DÍAS DE ENTRENAMIENTO</p>
          <div className="flex flex-wrap gap-2">
            {["lunes","martes","miercoles","jueves","viernes","sabado","domingo"].map((d) => {
              const activo = dias.includes(d)
              const esHoy = d === diaHoy
              return (
                <span
                  key={d}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold"
                  style={{
                    background: esHoy && activo ? "var(--orange)" : activo ? "var(--blue)" : "var(--background)",
                    color: activo ? "white" : "var(--foreground-subtle)",
                    border: `1px solid ${activo ? "transparent" : "var(--border)"}`,
                  }}
                >
                  {DIAS_LABEL[d]}
                  {esHoy && " · Hoy"}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de ejercicios */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {rutina.ejercicios.length} Ejercicio{rutina.ejercicios.length !== 1 ? "s" : ""}
          </h3>
        </div>

        <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
          {rutina.ejercicios.map((ej) => (
            <li key={ej.id} className="flex items-start gap-4 px-6 py-5">
              {/* Número */}
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
                style={{ background: "var(--blue)", color: "white" }}
              >
                {ej.orden}
              </span>

              <div className="flex-1">
                <p className="font-bold mb-1" style={{ color: "var(--foreground)" }}>{ej.nombre}</p>

                {/* Métricas en chips */}
                <div className="flex flex-wrap gap-2 mb-1">
                  <span
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                    style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
                  >
                    {ej.series ?? "—"} series
                  </span>
                  <span
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                    style={{ background: "var(--green-bg)", color: "var(--green)" }}
                  >
                    {ej.repeticiones ?? "—"} reps
                  </span>
                  {ej.descanso_segundos != null && (
                    <span
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                      style={{ background: "var(--orange-bg)", color: "var(--orange)" }}
                    >
                      {ej.descanso_segundos}s descanso
                    </span>
                  )}
                  {ej.rpe && (
                    <span
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                      style={{ background: "var(--purple-bg)", color: "var(--purple)" }}
                    >
                      RPE {ej.rpe}
                    </span>
                  )}
                </div>

                {ej.notas && (
                  <p className="text-xs italic mt-1" style={{ color: "var(--foreground-subtle)" }}>
                    💡 {ej.notas}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
