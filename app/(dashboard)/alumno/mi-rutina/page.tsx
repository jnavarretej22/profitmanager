import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { Dumbbell, Clock, Zap, Target, Timer, Coffee, CalendarClock, Weight, TrendingUp } from "lucide-react"
import { ExportarPDFBtn } from "@/components/domain/ExportarPDFBtn"
import { Badge, EmptyState } from "@/components/ui"
import type { Objetivo } from "@prisma/client"
import { CheckInRutina } from "./CheckInRutina"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: "Hipertrofia", perdida_grasa: "Pérdida de grasa",
  fuerza: "Fuerza", resistencia: "Resistencia", general: "General",
}

const DIA_NOMBRE: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles",
  jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
}

const DIA_CORTO: Record<string, string> = {
  lunes: "L", martes: "M", miercoles: "X", jueves: "J",
  viernes: "V", sabado: "S", domingo: "D",
}

const ORDEN_DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"]

export default async function MiRutinaPage() {
  const session = await auth()
  if (!session?.user.alumnoId) redirect("/login")

  const alumno = await prisma.alumno.findUnique({
    where: { id: session.user.alumnoId },
    include: {
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
    },
  })

  const rutinas    = alumno?.rutinas ?? []
  const diaHoyKey  = ORDEN_DIAS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  const hoyFecha   = new Date().toISOString().slice(0, 10)

  // Recolectar todos los dia_rutina_id de hoy en todas las rutinas activas
  const diasHoyIds = rutinas
    .map((r) => r.dias.find((d) => d.dia_semana === diaHoyKey)?.id)
    .filter((id): id is string => !!id)

  const logsHoy = diasHoyIds.length > 0
    ? await prisma.sesionRutinaLog.findMany({
        where: {
          alumno_id:     session.user.alumnoId,
          dia_rutina_id: { in: diasHoyIds },
          fecha:         new Date(hoyFecha + "T12:00:00"),
        },
        select: { dia_rutina_id: true, estado: true, energia: true, notas: true },
      })
    : []
  const logPorDiaId = new Map(logsHoy.map((l) => [l.dia_rutina_id, l]))

  if (rutinas.length === 0) {
    return (
      <div className="animate-fade-in">
        <h1 className="section-title mb-2">Mis rutinas</h1>
        <EmptyState
          icono={Dumbbell}
          titulo="Sin rutinas asignadas"
          subtitulo="Tu coach aún no te ha asignado una rutina. Espera a que lo haga."
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">Mis rutinas</h1>
        <p className="section-subtitle">
          {rutinas.length === 1
            ? "Vista completa de tu programa de entrenamiento"
            : `Tienes ${rutinas.length} programas activos`}
        </p>
      </div>

      {rutinas.map((rutina) => {
        const diaHoy        = rutina.dias.find((d) => d.dia_semana === diaHoyKey) ?? null
        const logHoy        = diaHoy ? logPorDiaId.get(diaHoy.id) ?? null : null
        const diasOrdenados = [...rutina.dias].sort(
          (a, b) => ORDEN_DIAS.indexOf(a.dia_semana) - ORDEN_DIAS.indexOf(b.dia_semana)
        )
        const totalEjercicios = rutina.dias.reduce((acc, d) => acc + d.ejercicios.length, 0)
        const diasEntreno     = diasOrdenados.filter((d) => !d.es_descanso).length

        return (
          <section key={rutina.id} className="space-y-4">
            {/* Header de la rutina */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--blue-bg)" }}>
                  <Dumbbell size={20} style={{ color: "var(--blue)" }} />
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-extrabold leading-tight" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                    {rutina.nombre}
                  </h2>
                  {rutina.descripcion && (
                    <p className="text-sm mt-0.5" style={{ color: "var(--foreground-muted)" }}>{rutina.descripcion}</p>
                  )}
                </div>
              </div>
              <ExportarPDFBtn href={`/api/exportar/rutina/${rutina.id}`} label="PDF" />
            </div>

            {/* Check-in del día para esta rutina */}
            <CheckInRutina
              diaRutinaIdHoy={diaHoy?.id ?? null}
              esHoyDescanso={diaHoy?.es_descanso ?? true}
              nombreFocoHoy={diaHoy?.nombre_foco ?? null}
              logExistente={logHoy ? { estado: logHoy.estado, energia: logHoy.energia, notas: logHoy.notas } : null}
              fechaHoy={hoyFecha}
            />

            {/* Card meta de la rutina */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex flex-wrap gap-3 mb-5">
                {rutina.objetivo && <Badge variant="blue">{OBJETIVO_LABEL[rutina.objetivo]}</Badge>}
                {rutina.duracion_minutos && (
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
                    <Clock size={13} /> {rutina.duracion_minutos} min por sesión
                  </span>
                )}
                {rutina.fecha_fin && (() => {
                  const fin     = new Date(rutina.fecha_fin.toISOString().split("T")[0] + "T12:00:00")
                  const vencida = fin < new Date()
                  return (
                    <span
                      className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1"
                      style={{
                        background: vencida ? "var(--red-bg, #FEF2F2)" : "var(--orange-bg)",
                        color:      vencida ? "var(--red)" : "var(--orange)",
                      }}
                    >
                      <CalendarClock size={12} />
                      {vencida
                        ? "Vigencia vencida"
                        : `Vigente hasta el ${fin.toLocaleDateString("es-EC", { day: "numeric", month: "long" })}`}
                    </span>
                  )
                })()}
              </div>

              {/* Días de la semana (mini overview) */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--foreground-subtle)" }}>
                  Días de entrenamiento ({diasEntreno})
                </p>
                <div className="flex flex-wrap gap-2">
                  {ORDEN_DIAS.map((d) => {
                    const diaData = rutina.dias.find((x) => x.dia_semana === d)
                    const activo  = !!diaData && !diaData.es_descanso
                    const esHoy   = d === diaHoyKey
                    return (
                      <div key={d} className="flex flex-col items-center gap-1">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold"
                          style={{
                            background: esHoy && activo ? "var(--orange)" : activo ? "var(--blue)" : "transparent",
                            color: activo ? "white" : "var(--foreground-subtle)",
                            border: activo ? "none" : "1.5px solid var(--border)",
                            boxShadow: (esHoy && activo) ? "0 3px 10px rgba(249,115,22,0.4)" : activo ? "0 3px 10px rgba(45,125,246,0.3)" : "none",
                          }}
                        >
                          {DIA_CORTO[d]}
                        </span>
                        {esHoy && activo && (
                          <span className="text-[9px] font-bold" style={{ color: "var(--orange)" }}>Hoy</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Ejercicios por día */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-subtle)" }}>
                {totalEjercicios} ejercicio{totalEjercicios !== 1 ? "s" : ""} en {diasEntreno} día{diasEntreno !== 1 ? "s" : ""}
              </p>

              {diasOrdenados.map((dia) => {
                const esHoy = dia.dia_semana === diaHoyKey
                return (
                  <div
                    key={dia.id}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "var(--background-card)",
                      border: `1px solid ${esHoy ? "var(--blue)" : "var(--border)"}`,
                      boxShadow: esHoy ? "0 0 0 3px rgba(45,125,246,0.08)" : "var(--shadow-sm)",
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-5 py-3 border-b"
                      style={{
                        borderColor: "var(--border)",
                        background: esHoy ? "var(--blue-bg)" : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {dia.es_descanso ? (
                          <Coffee size={16} style={{ color: "var(--foreground-subtle)" }} />
                        ) : (
                          <Dumbbell size={16} style={{ color: esHoy ? "var(--blue)" : "var(--foreground-muted)" }} />
                        )}
                        <span
                          className="text-sm font-bold"
                          style={{ color: esHoy ? "var(--blue)" : "var(--foreground)" }}
                        >
                          {DIA_NOMBRE[dia.dia_semana]}
                          {esHoy && <span className="ml-2 text-xs font-semibold" style={{ color: "var(--orange)" }}>Hoy</span>}
                        </span>
                        {dia.nombre_foco && !dia.es_descanso && (
                          <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>· {dia.nombre_foco}</span>
                        )}
                      </div>
                      {!dia.es_descanso && (
                        <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                          {dia.ejercicios.length} ejercicio{dia.ejercicios.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {dia.es_descanso ? (
                      <div className="flex items-center gap-3 px-5 py-4">
                        <Coffee size={20} style={{ color: "var(--foreground-subtle)" }} />
                        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                          Día de descanso — recupera y descansa bien.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {dia.ejercicios.map((ej) => (
                          <li key={ej.id} className="flex items-start gap-4 px-5 py-4">
                            <span
                              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                              style={{
                                background: esHoy ? "var(--orange)" : "var(--blue)",
                                color: "white",
                                boxShadow: esHoy ? "0 3px 8px rgba(249,115,22,0.4)" : "0 3px 8px rgba(45,125,246,0.4)",
                              }}
                            >
                              {ej.orden}
                            </span>

                            <div className="flex-1">
                              <p className="font-bold mb-1.5" style={{ color: "var(--foreground)" }}>{ej.nombre}</p>
                              <div className="flex flex-wrap gap-1.5 mb-1">
                                <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--blue-bg)", color: "var(--blue)" }}>
                                  <Dumbbell size={10} /> {ej.series ?? "—"} series
                                </span>
                                <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--green-bg)", color: "var(--green)" }}>
                                  <Zap size={10} /> {ej.repeticiones ?? "—"} reps
                                </span>
                                {ej.peso_kg != null && (
                                  <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold" style={{ background: "var(--red-bg, #FEF2F2)", color: "var(--red)" }}>
                                    <Weight size={10} /> {ej.peso_kg.toString()} kg
                                  </span>
                                )}
                                {ej.descanso_segundos != null && (
                                  <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--orange-bg)", color: "var(--orange)" }}>
                                    <Timer size={10} /> {ej.descanso_segundos}s
                                  </span>
                                )}
                                {ej.rpe && (
                                  <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}>
                                    <Target size={10} /> RPE {ej.rpe}
                                  </span>
                                )}
                              </div>
                              {ej.progresion && (
                                <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: "var(--blue)" }}>
                                  <TrendingUp size={11} /> {ej.progresion}
                                </p>
                              )}
                              {ej.notas && (
                                <p className="text-xs italic mt-1" style={{ color: "var(--foreground-subtle)" }}>
                                  💡 {ej.notas}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
