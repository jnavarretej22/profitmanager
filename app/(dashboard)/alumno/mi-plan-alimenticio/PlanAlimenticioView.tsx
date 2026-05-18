"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, UtensilsCrossed } from "lucide-react"
import { Badge } from "@/components/ui"

const MOMENTOS = [
  { id: "desayuno",     label: "Desayuno",      color: "var(--orange)",  bg: "var(--orange-bg)" },
  { id: "media_manana", label: "Media mañana",  color: "var(--blue)",    bg: "var(--blue-bg)" },
  { id: "almuerzo",    label: "Almuerzo",        color: "var(--green)",   bg: "var(--green-bg)" },
  { id: "merienda",    label: "Merienda",        color: "var(--purple)",  bg: "var(--purple-bg)" },
  { id: "cena",        label: "Cena",            color: "var(--foreground-muted)", bg: "var(--background)" },
] as const

type Comida = {
  id: string; momento: string; hora_sugerida: Date | null;
  descripcion: string; calorias: number | null;
  proteinas_g: number | null; carbohidratos_g: number | null; grasas_g: number | null
}

type Plan = {
  nombre: string; calorias_objetivo: number | null; comidas: Comida[]
}

export function PlanAlimenticioView({ plan }: { plan: Plan }) {
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>(
    Object.fromEntries(MOMENTOS.map((m) => [m.id, true]))
  )

  function toggle(id: string) {
    setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const totCal   = plan.comidas.reduce((s, c) => s + (c.calorias ?? 0), 0)
  const totProt  = plan.comidas.reduce((s, c) => s + (c.proteinas_g ?? 0), 0)
  const totCarbs = plan.comidas.reduce((s, c) => s + (c.carbohidratos_g ?? 0), 0)
  const totGrasas = plan.comidas.reduce((s, c) => s + (c.grasas_g ?? 0), 0)

  return (
    <>
      {/* Header del plan */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--green-bg)" }}>
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

        {/* Macros totales */}
        {totCal > 0 && (
          <>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: "kcal", valor: totCal, color: "var(--orange)", bg: "var(--orange-bg)" },
                { label: "Proteínas", valor: `${totProt}g`, color: "var(--blue)", bg: "var(--blue-bg)" },
                { label: "Carbos", valor: `${totCarbs}g`, color: "var(--green)", bg: "var(--green-bg)" },
                { label: "Grasas", valor: `${totGrasas}g`, color: "var(--purple)", bg: "var(--purple-bg)" },
              ].map(({ label, valor, color, bg }) => (
                <div key={label} className="rounded-xl py-2.5 text-center" style={{ background: bg }}>
                  <p className="text-sm font-extrabold" style={{ color }}>{valor}</p>
                  <p className="text-[10px]" style={{ color }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Barra de progreso de macros */}
            {(() => {
              const totalMacros = totProt * 4 + totCarbs * 4 + totGrasas * 9
              const pProt  = totalMacros > 0 ? (totProt * 4 / totalMacros) * 100 : 0
              const pCarbs = totalMacros > 0 ? (totCarbs * 4 / totalMacros) * 100 : 0
              const pGrasas = totalMacros > 0 ? (totGrasas * 9 / totalMacros) * 100 : 0

              if (plan.calorias_objetivo && totCal > 0) {
                const progresoCal = Math.min((totCal / plan.calorias_objetivo) * 100, 100)
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs" style={{ color: "var(--foreground-muted)" }}>
                      <span>Calorías del plan</span>
                      <span>{totCal} / {plan.calorias_objetivo} kcal</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progresoCal}%`,
                          background: progresoCal >= 100 ? "var(--green)" : "var(--orange)",
                        }}
                      />
                    </div>
                    <div className="flex gap-3 justify-center flex-wrap mt-1">
                      {[
                        { label: "Proteínas", pct: pProt, color: "var(--blue)" },
                        { label: "Carbos", pct: pCarbs, color: "var(--green)" },
                        { label: "Grasas", pct: pGrasas, color: "var(--purple)" },
                      ].map(({ label, pct, color }) => (
                        <span key={label} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                          {label} {Math.round(pct)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </>
        )}
      </div>

      {/* Comidas por momento */}
      {MOMENTOS.map(({ id, label, color, bg }) => {
        const comidas = plan.comidas.filter((c) => c.momento === id)
        if (comidas.length === 0) return null
        const abierto = abiertos[id]

        return (
          <div
            key={id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <button
              onClick={() => toggle(id)}
              className="w-full flex items-center justify-between px-5 py-4"
              style={{ borderBottom: abierto ? "1px solid var(--border)" : "none" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{label}</span>
                <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  ({comidas.length})
                </span>
              </div>
              {abierto
                ? <ChevronUp size={16} style={{ color: "var(--foreground-subtle)" }} />
                : <ChevronDown size={16} style={{ color: "var(--foreground-subtle)" }} />
              }
            </button>

            {abierto && (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {comidas.map((c) => (
                  <li key={c.id} className="px-5 py-4">
                    {c.hora_sugerida && (
                      <p className="text-xs font-bold mb-1" style={{ color }}>
                        🕐 {new Date(c.hora_sugerida).toTimeString().slice(0, 5)}
                      </p>
                    )}
                    <p className="text-sm mb-2" style={{ color: "var(--foreground)" }}>
                      {c.descripcion}
                    </p>
                    {(c.calorias || c.proteinas_g || c.carbohidratos_g || c.grasas_g) && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.calorias && <Badge variant="warning">{c.calorias} kcal</Badge>}
                        {c.proteinas_g && <Badge variant="blue">{c.proteinas_g}g Prot</Badge>}
                        {c.carbohidratos_g && <Badge variant="success">{c.carbohidratos_g}g Carbs</Badge>}
                        {c.grasas_g && <Badge variant="purple">{c.grasas_g}g Grasas</Badge>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </>
  )
}
