"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  fechasCitas: string[] // ISO strings (fecha_inicio de cada cita)
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]
const DIAS_HEADER = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"]

export function AgendaMiniCalendar({ fechasCitas }: Props) {
  const hoy = new Date()
  const [mes, setMes]   = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())

  // Set de "anio-mes-dia" para lookup O(1)
  const citaSet = new Set(
    fechasCitas.map((iso) => {
      const d = new Date(iso)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }),
  )

  // Primer día del mes (lunes = 0 … domingo = 6)
  const primero    = new Date(anio, mes, 1)
  const offset     = (primero.getDay() + 6) % 7
  const diasEnMes  = new Date(anio, mes + 1, 0).getDate()

  const celdas: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  function anterior() {
    if (mes === 0) { setMes(11); setAnio((a) => a - 1) }
    else setMes((m) => m - 1)
  }
  function siguiente() {
    if (mes === 11) { setMes(0); setAnio((a) => a + 1) }
    else setMes((m) => m + 1)
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Cabecera de navegación */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={anterior} className="btn-ghost p-1.5">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
          {MESES[mes]} {anio}
        </p>
        <button onClick={siguiente} className="btn-ghost p-1.5">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cabecera días */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_HEADER.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold uppercase"
            style={{ color: "var(--foreground-subtle)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Cuadrícula de días */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={i} />

          const clave    = `${anio}-${mes}-${dia}`
          const tieneCita = citaSet.has(clave)
          const esHoy     =
            anio === hoy.getFullYear() &&
            mes  === hoy.getMonth()    &&
            dia  === hoy.getDate()

          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  background: esHoy
                    ? "var(--blue)"
                    : tieneCita
                    ? "var(--blue-bg)"
                    : "transparent",
                  color: esHoy
                    ? "white"
                    : tieneCita
                    ? "var(--blue)"
                    : "var(--foreground-muted)",
                  fontWeight: esHoy || tieneCita ? 700 : 400,
                }}
              >
                {dia}
              </span>
              {/* Punto indicador de cita (no superponer en "hoy") */}
              {tieneCita && !esHoy && (
                <span
                  className="h-1 w-1 rounded-full mt-0.5"
                  style={{ background: "var(--blue)" }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
