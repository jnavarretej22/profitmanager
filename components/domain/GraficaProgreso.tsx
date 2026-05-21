"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import { TrendingUp, Lock } from "lucide-react"

type Metrica = "peso" | "cintura" | "cadera" | "pecho" | "brazo" | "pierna" | "porcentaje_grasa"
type Rango   = "1m" | "3m" | "6m" | "todo"

interface Props {
  alumnoId: string
  tieneGraficas: boolean
  mini?: boolean // modo compacto para dashboard del alumno
}

const METRICAS: { value: Metrica; label: string; unidad: string }[] = [
  { value: "peso",             label: "Peso",            unidad: "kg" },
  { value: "cintura",          label: "Cintura",         unidad: "cm" },
  { value: "cadera",           label: "Cadera",          unidad: "cm" },
  { value: "pecho",            label: "Pecho",           unidad: "cm" },
  { value: "brazo",            label: "Brazo",           unidad: "cm" },
  { value: "pierna",           label: "Pierna",          unidad: "cm" },
  { value: "porcentaje_grasa", label: "% Grasa",         unidad: "%" },
]

const RANGOS: { value: Rango; label: string }[] = [
  { value: "1m",   label: "1 mes"   },
  { value: "3m",   label: "3 meses" },
  { value: "6m",   label: "6 meses" },
  { value: "todo", label: "Todo"    },
]

const COLORES_MEDIDAS = ["#2D7DF6","#22C55E","#F97316","#8B5CF6","#EF4444"]

function desdeRango(rango: Rango): string | undefined {
  if (rango === "todo") return undefined
  const d = new Date()
  if (rango === "1m") d.setMonth(d.getMonth() - 1)
  if (rango === "3m") d.setMonth(d.getMonth() - 3)
  if (rango === "6m") d.setMonth(d.getMonth() - 6)
  return d.toISOString().split("T")[0]
}

function formatFechaEje(fecha: string): string {
  const [, mes, dia] = fecha.split("-")
  return `${dia}/${mes}`
}

// Tooltip personalizado iOS-style
function TooltipCustom({ active, payload, label, unidad }: {
  active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string; unidad: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
    >
      <p className="font-bold mb-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name !== "valor" ? `${p.name}: ` : ""}{p.value} {unidad}
        </p>
      ))}
    </div>
  )
}

export function GraficaProgreso({ alumnoId, tieneGraficas, mini = false }: Props) {
  const [metrica, setMetrica] = useState<Metrica>("peso")
  const [rango,   setRango]   = useState<Rango>("3m")
  const [datos,   setDatos]   = useState<{ fecha: string; valor: number | null }[]>([])
  const [multiSerie, setMultiSerie] = useState<Record<string, unknown>[]>([])
  const [cargando, setCargando] = useState(false)
  const [modoMulti, setModoMulti] = useState(false)

  useEffect(() => {
    if (!tieneGraficas) return
    setCargando(true) // eslint-disable-line react-hooks/set-state-in-effect
    const desde = desdeRango(rango)
    const url = `/api/alumnos/${alumnoId}/progreso/grafica?metrica=${metrica}${desde ? `&desde=${desde}` : ""}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setDatos(data.datos ?? [])
        setMultiSerie(data.multiSerie ?? [])
      })
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [alumnoId, metrica, rango, tieneGraficas])

  const unidadActual = METRICAS.find((m) => m.value === metrica)?.unidad ?? "kg"

  // Modo mini — solo gráfica de peso sin controles
  if (mini) {
    if (!tieneGraficas) return null
    return (
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={datos} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradAzulMini" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2D7DF6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2D7DF6" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <XAxis dataKey="fecha" hide />
            <YAxis hide domain={["auto","auto"]} />
            <Tooltip content={<TooltipCustom unidad="kg" />} />
            <Area type="monotone" dataKey="valor" name="valor" stroke="#2D7DF6" strokeWidth={2} fill="url(#gradAzulMini)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Placeholder cuando plan no tiene acceso
  if (!tieneGraficas) {
    return (
      <div
        className="rounded-2xl p-8 text-center relative overflow-hidden"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
      >
        {/* Gráfica "fantasma" con blur */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <AreaChart data={[{fecha:"Ene",valor:70},{fecha:"Feb",valor:68},{fecha:"Mar",valor:66},{fecha:"Abr",valor:65}]}>
                <Area type="monotone" dataKey="valor" stroke="#2D7DF6" fill="#2D7DF640" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="absolute inset-0 backdrop-blur-sm" />
        <div className="relative z-10">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--blue-bg)" }}
          >
            <Lock size={18} style={{ color: "var(--blue)" }} />
          </div>
          <p className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>
            Gráficas de progreso
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>
            Disponible en el Plan Inicial
          </p>
          <Link href="/coach/mi-plan" className="btn-primary text-xs py-1.5 px-4">
            Ver planes
          </Link>
        </div>
      </div>
    )
  }

  // Métricas de medidas para multi-serie
  const MEDIDAS_KEYS = ["cintura","cadera","pecho","brazo","pierna"]

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--blue-bg)" }}>
          <TrendingUp size={14} style={{ color: "var(--blue)" }} />
        </div>
        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Gráficas de progreso</p>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Selector de métrica */}
        <div className="flex gap-1 flex-wrap">
          {METRICAS.map((m) => (
            <button
              key={m.value}
              onClick={() => { setMetrica(m.value); setModoMulti(false) }}
              className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors"
              style={{
                background: metrica === m.value && !modoMulti ? "var(--blue)" : "var(--background-hover)",
                color:      metrica === m.value && !modoMulti ? "white" : "var(--foreground-muted)",
              }}
            >
              {m.label}
            </button>
          ))}
          <button
            onClick={() => setModoMulti(true)}
            className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors"
            style={{
              background: modoMulti ? "var(--purple)" : "var(--background-hover)",
              color:      modoMulti ? "white" : "var(--foreground-muted)",
            }}
          >
            Medidas
          </button>
        </div>

        {/* Selector de rango */}
        <div
          className="flex rounded-xl overflow-hidden ml-auto"
          style={{ border: "1px solid var(--border)" }}
        >
          {RANGOS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRango(r.value)}
              className="text-xs px-3 py-1.5 font-semibold transition-colors"
              style={{
                background: rango === r.value ? "var(--blue)" : "transparent",
                color:      rango === r.value ? "white" : "var(--foreground-muted)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfica */}
      <div style={{ height: 240 }}>
        {cargando ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--blue)", borderTopColor: "transparent" }} />
          </div>
        ) : datos.length === 0 && !modoMulti ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Sin datos para el período seleccionado</p>
          </div>
        ) : modoMulti ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiSerie} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="fecha" tickFormatter={formatFechaEje} tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} unit=" cm" />
              <Tooltip content={<TooltipCustom unidad="cm" />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {MEDIDAS_KEYS.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} name={k.charAt(0).toUpperCase() + k.slice(1)} stroke={COLORES_MEDIDAS[i]} strokeWidth={2} dot={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datos} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAzul" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2D7DF6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2D7DF6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="fecha" tickFormatter={formatFechaEje} tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} unit={` ${unidadActual}`} domain={["auto","auto"]} />
              <Tooltip content={<TooltipCustom unidad={unidadActual} />} />
              <Area
                type="monotone"
                dataKey="valor"
                name={METRICAS.find((m) => m.value === metrica)?.label ?? "Valor"}
                stroke="#2D7DF6"
                strokeWidth={2.5}
                fill="url(#gradAzul)"
                dot={{ fill: "#2D7DF6", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
