"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"

type Opcion = "sin_limite" | "esta_semana" | "n_semanas" | "este_mes" | "n_meses"

const SEMANAS_OPTS = [2, 4, 6, 8, 12]
const MESES_OPTS   = [1, 2, 3, 6]

function calcularFechaFin(opcion: Opcion, n: number): string | null {
  const hoy = new Date()
  if (opcion === "sin_limite") return null
  if (opcion === "esta_semana") {
    const diasHastaDOM = hoy.getDay() === 0 ? 7 : 7 - hoy.getDay()
    const dom = new Date(hoy)
    dom.setDate(hoy.getDate() + diasHastaDOM)
    return dom.toISOString().split("T")[0]
  }
  if (opcion === "n_semanas") {
    const fin = new Date(hoy)
    fin.setDate(hoy.getDate() + n * 7)
    return fin.toISOString().split("T")[0]
  }
  if (opcion === "este_mes") {
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    return fin.toISOString().split("T")[0]
  }
  if (opcion === "n_meses") {
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + n + 1, 0)
    return fin.toISOString().split("T")[0]
  }
  return null
}

function formatFecha(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-EC", {
    day: "numeric", month: "long", year: "numeric",
  })
}

interface Props {
  value:    string | null
  onChange: (fechaFin: string | null) => void
}

export function VigenciaSelector({ value, onChange }: Props) {
  const [opcion, setOpcion] = useState<Opcion>("sin_limite")
  const [nSemanas, setNSemanas] = useState(4)
  const [nMeses,   setNMeses]   = useState(1)

  function seleccionar(op: Opcion, n?: number) {
    const nVal = op === "n_semanas" ? (n ?? nSemanas) : (n ?? nMeses)
    setOpcion(op)
    if (op === "n_semanas" && n !== undefined) setNSemanas(n)
    if (op === "n_meses"   && n !== undefined) setNMeses(n)
    onChange(calcularFechaFin(op, nVal))
  }

  const OPCIONES: { id: Opcion; label: string }[] = [
    { id: "sin_limite",   label: "Sin límite" },
    { id: "esta_semana",  label: "Esta semana" },
    { id: "n_semanas",    label: "Semanas" },
    { id: "este_mes",     label: "Este mes" },
    { id: "n_meses",      label: "Meses" },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Calendar size={13} style={{ color: "var(--foreground-subtle)" }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-subtle)" }}>
          Vigencia
        </span>
      </div>

      {/* Chips principales */}
      <div className="flex flex-wrap gap-1.5">
        {OPCIONES.map(({ id, label }) => {
          const activo = opcion === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => seleccionar(id)}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: activo ? "var(--blue)" : "var(--background-card)",
                color:      activo ? "white" : "var(--foreground-muted)",
                border:     `1px solid ${activo ? "var(--blue)" : "var(--border)"}`,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Sub-selector N semanas */}
      {opcion === "n_semanas" && (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {SEMANAS_OPTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => seleccionar("n_semanas", n)}
              className="rounded-xl px-2.5 py-1 text-xs font-semibold transition-all"
              style={{
                background: nSemanas === n ? "var(--blue-bg)" : "transparent",
                color:      nSemanas === n ? "var(--blue)" : "var(--foreground-subtle)",
                border:     `1px solid ${nSemanas === n ? "var(--blue)" : "var(--border)"}`,
              }}
            >
              {n} sem.
            </button>
          ))}
        </div>
      )}

      {/* Sub-selector N meses */}
      {opcion === "n_meses" && (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {MESES_OPTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => seleccionar("n_meses", n)}
              className="rounded-xl px-2.5 py-1 text-xs font-semibold transition-all"
              style={{
                background: nMeses === n ? "var(--blue-bg)" : "transparent",
                color:      nMeses === n ? "var(--blue)" : "var(--foreground-subtle)",
                border:     `1px solid ${nMeses === n ? "var(--blue)" : "var(--border)"}`,
              }}
            >
              {n} {n === 1 ? "mes" : "meses"}
            </button>
          ))}
        </div>
      )}

      {/* Fecha resultante */}
      {value && (
        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
          Vence el{" "}
          <span className="font-semibold" style={{ color: "var(--foreground)" }}>
            {formatFecha(value)}
          </span>
        </p>
      )}
    </div>
  )
}
