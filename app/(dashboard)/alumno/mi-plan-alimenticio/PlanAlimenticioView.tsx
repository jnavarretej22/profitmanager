"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { UtensilsCrossed, CalendarClock, Check, Circle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui"

const DIAS_SEMANA = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const
type DiaSemana = typeof DIAS_SEMANA[number]

const DIA_CORTO: Record<string, string> = {
  lunes: "L", martes: "M", miercoles: "X", jueves: "J",
  viernes: "V", sabado: "S", domingo: "D",
}
const DIA_NOMBRE: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
  viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
}

const MOMENTOS_ORDEN = ["desayuno","media_manana","almuerzo","merienda","cena"]
const MOMENTOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno", media_manana: "Media mañana",
  almuerzo: "Almuerzo", merienda: "Merienda", cena: "Cena",
}
const MOMENTO_COLOR: Record<string, string> = {
  desayuno: "var(--orange)", media_manana: "#EAB308",
  almuerzo: "var(--green)", merienda: "var(--blue)", cena: "var(--purple)",
}

type ComidaView = {
  id: string; momento: string; hora_sugerida: string | null;
  descripcion: string; calorias: number | null;
  proteinas_g: number | null; carbohidratos_g: number | null; grasas_g: number | null
}

type DiaPlanView = {
  id: string; dia_semana: string; nombre_foco: string | null;
  es_libre: boolean; orden: number; comidas: ComidaView[]
}

type Plan = {
  id: string; nombre: string; calorias_objetivo: number | null;
  fecha_fin: string | null; dias: DiaPlanView[]
}

interface Props {
  plan:     Plan
  hoyFecha: string
  logsHoy:  Record<string, boolean>
}

export function PlanAlimenticioView({ plan, hoyFecha, logsHoy }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const hoyIdx = new Date().getDay()
  const hoy = DIAS_SEMANA[hoyIdx === 0 ? 6 : hoyIdx - 1]
  const [diaActivo, setDiaActivo] = useState<DiaSemana>(hoy)
  const [logsLocal, setLogsLocal] = useState<Record<string, boolean>>(logsHoy)
  const [enviando, setEnviando]   = useState<string | null>(null)

  async function toggleComida(comidaId: string) {
    const eraCumplida = !!logsLocal[comidaId]
    const ahora       = !eraCumplida

    setEnviando(comidaId)
    setLogsLocal((prev) => ({ ...prev, [comidaId]: ahora }))
    try {
      if (ahora) {
        const res = await fetch("/api/alumno/comidas-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comida_plan_id: comidaId,
            fecha:          hoyFecha,
            cumplida:       true,
          }),
        })
        if (!res.ok) setLogsLocal((prev) => ({ ...prev, [comidaId]: eraCumplida }))
      } else {
        const res = await fetch(`/api/alumno/comidas-log?comida_plan_id=${comidaId}&fecha=${hoyFecha}`, {
          method: "DELETE",
        })
        if (!res.ok) setLogsLocal((prev) => ({ ...prev, [comidaId]: eraCumplida }))
      }
      startTransition(() => router.refresh())
    } finally {
      setEnviando(null)
    }
  }

  const diaInfo = plan.dias.find((d) => d.dia_semana === diaActivo)

  // Día sin comidas se trata como libre (fallback para datos creados antes del fix).
  const esLibreDiaActivo = !diaInfo || diaInfo.es_libre || diaInfo.comidas.length === 0

  const comidasOrd = !esLibreDiaActivo && diaInfo
    ? [...diaInfo.comidas].sort((a, b) => MOMENTOS_ORDEN.indexOf(a.momento) - MOMENTOS_ORDEN.indexOf(b.momento))
    : []

  const totCal    = comidasOrd.reduce((s, c) => s + (c.calorias    ?? 0), 0)
  const totProt   = comidasOrd.reduce((s, c) => s + (c.proteinas_g ?? 0), 0)
  const totCarbs  = comidasOrd.reduce((s, c) => s + (c.carbohidratos_g ?? 0), 0)
  const totGrasas = comidasOrd.reduce((s, c) => s + (c.grasas_g    ?? 0), 0)

  const esHoy           = diaActivo === hoy
  const cumplidasHoy    = esHoy ? comidasOrd.filter((c) => logsLocal[c.id]).length : 0

  // Vigencia
  const vigencia = plan.fecha_fin ? (() => {
    const fin     = new Date(plan.fecha_fin + "T12:00:00")
    const vencida = fin < new Date()
    return { fin, vencida }
  })() : null

  return (
    <>
      {/* Header del plan */}
      <div className="rounded-2xl p-5" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-start gap-3 mb-2">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--green-bg)" }}>
            <UtensilsCrossed size={20} style={{ color: "var(--green)" }} />
          </span>
          <div>
            <h2 className="font-bold" style={{ color: "var(--foreground)" }}>{plan.nombre}</h2>
            {plan.calorias_objetivo && (
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                Objetivo: {plan.calorias_objetivo} kcal/día
              </p>
            )}
          </div>
        </div>

        {vigencia && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1"
            style={{
              background: vigencia.vencida ? "var(--red-bg, #FEF2F2)" : "var(--green-bg)",
              color:      vigencia.vencida ? "var(--red)" : "var(--green)",
            }}
          >
            <CalendarClock size={12} />
            {vigencia.vencida
              ? "Plan vencido"
              : `Vigente hasta el ${vigencia.fin.toLocaleDateString("es-EC", { day: "numeric", month: "long" })}`}
          </span>
        )}
      </div>

      {/* Tabs de días */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex overflow-x-auto border-b" style={{ borderColor: "var(--border)" }}>
          {DIAS_SEMANA.map((d) => {
            const dInfo    = plan.dias.find((x) => x.dia_semana === d)
            const esActivo = d === diaActivo
            const esHoy    = d === hoy
            const numCom   = dInfo?.comidas.length ?? 0
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDiaActivo(d)}
                className="flex-shrink-0 flex flex-col items-center px-4 py-3 text-xs font-bold transition-colors"
                style={{
                  color:        esActivo ? "var(--green)" : "var(--foreground-muted)",
                  borderBottom: esActivo ? "2px solid var(--green)" : "2px solid transparent",
                  background:   esActivo ? "var(--green-bg)" : "transparent",
                }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full mb-1 font-extrabold"
                  style={{
                    background: esHoy && esActivo ? "var(--green)" : esHoy ? "var(--green)22" : "transparent",
                    color:      esHoy && esActivo ? "white" : esActivo ? "var(--green)" : "var(--foreground-muted)",
                  }}
                >
                  {DIA_CORTO[d]}
                </span>
                {dInfo?.es_libre || (dInfo && numCom === 0) ? (
                  <span style={{ color: "var(--foreground-subtle)", fontSize: "9px" }}>LIBRE</span>
                ) : dInfo ? (
                  <span style={{ fontSize: "9px" }}>{numCom} com.</span>
                ) : (
                  <span style={{ color: "var(--foreground-subtle)", fontSize: "9px" }}>—</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Panel del día */}
        {!diaInfo ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No hay datos para {DIA_NOMBRE[diaActivo]}.</p>
          </div>
        ) : esLibreDiaActivo ? (
          <div className="flex flex-col items-center justify-center py-12 px-5">
            <UtensilsCrossed size={32} className="mb-3" style={{ color: "var(--orange)" }} />
            <p className="text-base font-bold mb-1" style={{ color: "var(--orange)" }}>Día libre — {DIA_NOMBRE[diaActivo]}</p>
            <p className="text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
              Hoy puedes comer sin restricciones. Disfruta con moderación.
            </p>
          </div>
        ) : (
          <div>
            {/* Foco del día + macros totales */}
            {(diaInfo.nombre_foco || totCal > 0) && (
              <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                {diaInfo.nombre_foco && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--foreground-subtle)" }}>
                      {DIA_NOMBRE[diaActivo]}
                    </p>
                    <p className="font-bold" style={{ color: "var(--foreground)" }}>{diaInfo.nombre_foco}</p>
                  </div>
                )}
                {totCal > 0 && (
                  <>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[
                        { label: "kcal",    valor: totCal,          color: "var(--orange)", bg: "var(--orange-bg)" },
                        { label: "Proteínas",valor: `${totProt}g`,  color: "var(--blue)",   bg: "var(--blue-bg)"   },
                        { label: "Carbos",  valor: `${totCarbs}g`,  color: "var(--green)",  bg: "var(--green-bg)"  },
                        { label: "Grasas",  valor: `${totGrasas}g`, color: "var(--purple)", bg: "var(--purple-bg)" },
                      ].map(({ label, valor, color, bg }) => (
                        <div key={label} className="rounded-xl py-2 text-center" style={{ background: bg }}>
                          <p className="text-sm font-extrabold" style={{ color }}>{valor}</p>
                          <p className="text-[10px]" style={{ color }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Barra de macros */}
                    {(() => {
                      const totalMacros = totProt * 4 + totCarbs * 4 + totGrasas * 9
                      const pProt   = totalMacros > 0 ? (totProt * 4   / totalMacros) * 100 : 0
                      const pCarbs  = totalMacros > 0 ? (totCarbs * 4  / totalMacros) * 100 : 0
                      const pGrasas = totalMacros > 0 ? (totGrasas * 9 / totalMacros) * 100 : 0
                      return (
                        <div>
                          <div className="flex h-2 w-full overflow-hidden rounded-full">
                            <div style={{ width: `${pProt}%`,   background: "var(--blue)"   }} />
                            <div style={{ width: `${pCarbs}%`,  background: "var(--green)"  }} />
                            <div style={{ width: `${pGrasas}%`, background: "var(--purple)" }} />
                          </div>
                          <div className="flex gap-3 mt-1.5 justify-center flex-wrap">
                            {[
                              { label: "Proteínas", pct: pProt,   color: "var(--blue)"   },
                              { label: "Carbos",    pct: pCarbs,  color: "var(--green)"  },
                              { label: "Grasas",    pct: pGrasas, color: "var(--purple)" },
                            ].map(({ label, pct, color }) => (
                              <span key={label} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                                {label} {Math.round(pct)}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            )}

            {/* Resumen "cumplidas hoy" */}
            {esHoy && comidasOrd.length > 0 && (
              <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: "var(--green-bg)", borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs font-bold" style={{ color: "var(--green)" }}>
                  {cumplidasHoy} de {comidasOrd.length} comidas cumplidas hoy
                </span>
                {cumplidasHoy === comidasOrd.length && comidasOrd.length > 0 && (
                  <span className="text-xs font-bold" style={{ color: "var(--green)" }}>¡Día completo!</span>
                )}
              </div>
            )}

            {/* Lista de comidas */}
            {comidasOrd.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Sin comidas registradas para este día.</p>
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {comidasOrd.map((c) => {
                  const color = MOMENTO_COLOR[c.momento] ?? "var(--foreground-muted)"
                  const cumplida = !!logsLocal[c.id]
                  const cargando = enviando === c.id
                  return (
                    <li key={c.id} className="px-5 py-4 flex items-start gap-3" style={{ borderLeft: "3px solid " + color, opacity: esHoy && cumplida ? 0.7 : 1 }}>
                      {esHoy && (
                        <button
                          type="button"
                          onClick={() => toggleComida(c.id)}
                          disabled={cargando}
                          className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full transition disabled:opacity-60 mt-0.5"
                          style={{
                            background: cumplida ? "var(--green)" : "transparent",
                            border:     `2px solid ${cumplida ? "var(--green)" : "var(--border)"}`,
                            color:      cumplida ? "white" : "var(--foreground-subtle)",
                          }}
                          title={cumplida ? "Marcar como no cumplida" : "Marcar como cumplida"}
                        >
                          {cargando ? <Loader2 size={14} className="animate-spin" /> : cumplida ? <Check size={14} /> : <Circle size={12} />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md" style={{ background: color + "22", color }}>
                            {MOMENTOS_LABEL[c.momento] ?? c.momento}
                          </span>
                          {c.hora_sugerida && (
                            <span className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
                              🕐 {c.hora_sugerida}
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-2" style={{ color: "var(--foreground)", textDecoration: esHoy && cumplida ? "line-through" : "none" }}>{c.descripcion}</p>
                        {(c.calorias || c.proteinas_g || c.carbohidratos_g || c.grasas_g) && (
                          <div className="flex flex-wrap gap-1.5">
                            {c.calorias        && <Badge variant="warning">{c.calorias} kcal</Badge>}
                            {c.proteinas_g     && <Badge variant="blue">{c.proteinas_g}g Prot</Badge>}
                            {c.carbohidratos_g && <Badge variant="success">{c.carbohidratos_g}g Carbs</Badge>}
                            {c.grasas_g        && <Badge variant="purple">{c.grasas_g}g Grasas</Badge>}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  )
}
