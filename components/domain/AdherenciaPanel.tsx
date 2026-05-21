"use client"

import { useEffect, useState } from "react"
import { Dumbbell, UtensilsCrossed, Loader2, Activity, AlertCircle } from "lucide-react"

type Estado = "completada" | "parcial" | "no_realizada"

type LogSesion = {
  id: string; fecha: string; estado: Estado;
  energia: number | null; notas: string | null;
  dia_semana: string; nombre_foco: string | null
}
type LogComida = {
  id: string; fecha: string; cumplida: boolean;
  notas: string | null; momento: string; descripcion: string
}

type Adherencia = {
  dias: number
  rango: { desde: string; hasta: string }
  rutina:  { esperadas: number; completadas: number; parciales: number; saltadas: number; pct: number | null }
  comidas: { esperadas: number; cumplidas: number; pct: number | null }
  logs_sesiones: LogSesion[]
  logs_comidas:  LogComida[]
}

const DIA_CORTO: Record<string, string> = {
  lunes: "L", martes: "M", miercoles: "X", jueves: "J",
  viernes: "V", sabado: "S", domingo: "D",
}
const MOMENTOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno", media_manana: "Media mañana",
  almuerzo: "Almuerzo", merienda: "Merienda", cena: "Cena",
}
const ESTADO_LABEL: Record<Estado, string> = {
  completada: "Completada", parcial: "Parcial", no_realizada: "No realizada",
}
const ESTADO_COLOR: Record<Estado, { bg: string; fg: string }> = {
  completada:   { bg: "var(--green-bg)",                   fg: "var(--green)"  },
  parcial:      { bg: "var(--orange-bg)",                  fg: "var(--orange)" },
  no_realizada: { bg: "var(--red-bg, #FEF2F2)",            fg: "var(--red)"    },
}

function ColorBarPct({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <p className="text-xs italic" style={{ color: "var(--foreground-subtle)" }}>
        Sin programa esperado
      </p>
    )
  }
  const color = pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)"
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden mt-1.5" style={{ background: "var(--border)" }}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function AdherenciaPanel({ alumnoId }: { alumnoId: string }) {
  const [dias, setDias]   = useState(7)
  const [data, setData]   = useState<Adherencia | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    fetch(`/api/alumnos/${alumnoId}/adherencia?dias=${dias}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Error al cargar")))
      .then((d) => { if (!cancelado) setData(d) })
      .catch((e) => { if (!cancelado) setError(e.message) })
      .finally(() => { if (!cancelado) setCargando(false) })
    return () => { cancelado = true }
  }, [alumnoId, dias])

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--foreground-subtle)" }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl p-6 flex items-start gap-3" style={{ background: "var(--red-bg, #FEF2F2)", border: "1px solid var(--red)33" }}>
        <AlertCircle size={18} style={{ color: "var(--red)" }} />
        <p className="text-sm" style={{ color: "var(--red)" }}>{error ?? "No se pudo cargar la adherencia"}</p>
      </div>
    )
  }

  const sinDatos = data.rutina.esperadas === 0 && data.comidas.esperadas === 0 && data.logs_sesiones.length === 0 && data.logs_comidas.length === 0

  return (
    <div className="space-y-4">
      {/* Header con selector de rango */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity size={18} style={{ color: "var(--blue)" }} />
          <h3 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
            Adherencia · últimos {data.dias} días
          </h3>
        </div>
        <div className="flex gap-1.5">
          {[7, 14, 30].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDias(n)}
              className="rounded-xl px-3 py-1 text-xs font-semibold transition"
              style={{
                background: dias === n ? "var(--blue)" : "var(--background-card)",
                color:      dias === n ? "white" : "var(--foreground-muted)",
                border:     `1px solid ${dias === n ? "var(--blue)" : "var(--border)"}`,
              }}
            >
              {n} días
            </button>
          ))}
        </div>
      </div>

      {sinDatos && (
        <div className="rounded-2xl p-5 text-center" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            Aún no hay datos de adherencia. El alumno todavía no ha registrado check-ins.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl p-5" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--blue-bg)" }}>
              <Dumbbell size={15} style={{ color: "var(--blue)" }} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-subtle)" }}>
              Rutina
            </span>
          </div>
          <ColorBarPct pct={data.rutina.pct} />
          <p className="text-xs mt-2" style={{ color: "var(--foreground-muted)" }}>
            <span className="font-bold" style={{ color: "var(--green)" }}>{data.rutina.completadas}</span> completadas
            {data.rutina.parciales > 0 && <> · <span style={{ color: "var(--orange)" }}>{data.rutina.parciales} parciales</span></>}
            {data.rutina.saltadas > 0 && <> · <span style={{ color: "var(--red)" }}>{data.rutina.saltadas} saltadas</span></>}
            {data.rutina.esperadas > 0 && <> de {data.rutina.esperadas} esperadas</>}
          </p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--green-bg)" }}>
              <UtensilsCrossed size={15} style={{ color: "var(--green)" }} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-subtle)" }}>
              Comidas
            </span>
          </div>
          <ColorBarPct pct={data.comidas.pct} />
          <p className="text-xs mt-2" style={{ color: "var(--foreground-muted)" }}>
            <span className="font-bold" style={{ color: "var(--green)" }}>{data.comidas.cumplidas}</span> cumplidas
            {data.comidas.esperadas > 0 && <> de {data.comidas.esperadas} esperadas</>}
          </p>
        </div>
      </div>

      {/* Log de sesiones reciente */}
      {data.logs_sesiones.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <Dumbbell size={14} style={{ color: "var(--blue)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Check-ins de rutina</span>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {data.logs_sesiones.map((l) => {
              const color = ESTADO_COLOR[l.estado]
              return (
                <li key={l.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
                      style={{ background: color.bg, color: color.fg }}
                    >
                      {DIA_CORTO[l.dia_semana] ?? "?"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs font-bold" style={{ color: color.fg }}>{ESTADO_LABEL[l.estado]}</span>
                        <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>· {l.fecha}</span>
                        {l.nombre_foco && <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>· {l.nombre_foco}</span>}
                        {l.energia != null && (
                          <span className="text-xs" style={{ color: "var(--orange)" }}>
                            {"★".repeat(l.energia)}{"☆".repeat(5 - l.energia)}
                          </span>
                        )}
                      </div>
                      {l.notas && (
                        <p className="text-xs italic mt-1" style={{ color: "var(--foreground-muted)" }}>
                          "{l.notas}"
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Log de comidas con notas */}
      {data.logs_comidas.filter((c) => c.notas).length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
            <UtensilsCrossed size={14} style={{ color: "var(--green)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Notas sobre comidas</span>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {data.logs_comidas.filter((c) => c.notas).map((l) => (
              <li key={l.id} className="px-5 py-3">
                <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-bold" style={{ color: "var(--green)" }}>
                    {MOMENTOS_LABEL[l.momento] ?? l.momento}
                  </span>
                  <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>· {l.fecha}</span>
                </div>
                <p className="text-xs italic" style={{ color: "var(--foreground-muted)" }}>"{l.notas}"</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
