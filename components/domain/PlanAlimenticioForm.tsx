"use client"

import Link from "next/link"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Save, BookOpen } from "lucide-react"
import { usePlan } from "@/lib/plan-context"

const MOMENTOS = [
  { id: "desayuno",    label: "Desayuno",      color: "var(--orange)" },
  { id: "media_manana", label: "Media mañana", color: "var(--yellow, #EAB308)" },
  { id: "almuerzo",   label: "Almuerzo",       color: "var(--green)" },
  { id: "merienda",   label: "Merienda",       color: "var(--blue)" },
  { id: "cena",       label: "Cena",           color: "var(--purple)" },
] as const

type Momento = typeof MOMENTOS[number]["id"]

type Comida = {
  tempId: string
  momento: Momento
  hora_sugerida: string
  descripcion: string
  calorias: string
  proteinas_g: string
  carbohidratos_g: string
  grasas_g: string
}

type AlumnoOption = { id: string; nombre: string; apellido: string }

interface PlanAlimenticioFormProps {
  planId?: string
  valorInicial?: {
    nombre?: string
    objetivo?: string
    calorias_objetivo?: number
    es_template?: boolean
    alumno_id?: string | null
    comidas?: Omit<Comida, "tempId">[]
  }
  alumnos: AlumnoOption[]
}

function nuevaComida(momento: Momento): Comida {
  return {
    tempId: crypto.randomUUID(),
    momento,
    hora_sugerida: "",
    descripcion: "",
    calorias: "",
    proteinas_g: "",
    carbohidratos_g: "",
    grasas_g: "",
  }
}

function sumarMacros(comidas: Comida[]) {
  return comidas.reduce(
    (acc, c) => ({
      calorias: acc.calorias + (parseFloat(c.calorias) || 0),
      proteinas: acc.proteinas + (parseFloat(c.proteinas_g) || 0),
      carbohidratos: acc.carbohidratos + (parseFloat(c.carbohidratos_g) || 0),
      grasas: acc.grasas + (parseFloat(c.grasas_g) || 0),
    }),
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
  )
}

export function PlanAlimenticioForm({ planId, valorInicial = {}, alumnos }: PlanAlimenticioFormProps) {
  const router = useRouter()
  const { tieneFeature } = usePlan()
  const esEdicion = !!planId
  const tieneTemplatesDietas = tieneFeature("templates_dietas_objetivo")

  const [nombre, setNombre] = useState(valorInicial.nombre ?? "")
  const [objetivo, setObjetivo] = useState(valorInicial.objetivo ?? "")
  const [calObjetivo, setCalObjetivo] = useState(valorInicial.calorias_objetivo?.toString() ?? "")
  const [esTemplate, setEsTemplate] = useState(valorInicial.es_template ?? false)
  const [alumnoId, setAlumnoId] = useState(valorInicial.alumno_id ?? "")
  const [comidas, setComidas] = useState<Comida[]>(
    valorInicial.comidas?.map((c) => ({ ...c, tempId: crypto.randomUUID() })) ?? []
  )
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<Momento, boolean>>(
    { desayuno: true, media_manana: true, almuerzo: true, merienda: false, cena: true }
  )

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  const toggleSeccion = (m: Momento) =>
    setSeccionesAbiertas((s) => ({ ...s, [m]: !s[m] }))

  const agregarComida = (momento: Momento) =>
    setComidas((prev) => [...prev, nuevaComida(momento)])

  const eliminarComida = (tempId: string) =>
    setComidas((prev) => prev.filter((c) => c.tempId !== tempId))

  const actualizarComida = useCallback(
    (tempId: string, campo: keyof Comida, valor: string) =>
      setComidas((prev) => prev.map((c) => c.tempId === tempId ? { ...c, [campo]: valor } : c)),
    []
  )

  const totales = sumarMacros(comidas)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return }

    setError("")
    setCargando(true)
    try {
      const body = {
        nombre, objetivo: objetivo || undefined,
        calorias_objetivo: calObjetivo ? parseInt(calObjetivo) : undefined,
        es_template: esTemplate,
        alumno_id: alumnoId || null,
        comidas: comidas.map((c) => ({
          momento: c.momento,
          hora_sugerida: c.hora_sugerida || undefined,
          descripcion: c.descripcion,
          calorias: c.calorias ? parseInt(c.calorias) : undefined,
          proteinas_g: c.proteinas_g ? parseInt(c.proteinas_g) : undefined,
          carbohidratos_g: c.carbohidratos_g ? parseInt(c.carbohidratos_g) : undefined,
          grasas_g: c.grasas_g ? parseInt(c.grasas_g) : undefined,
        })),
      }

      const url = esEdicion ? `/api/planes-alimenticios/${planId}` : "/api/planes-alimenticios"
      const method = esEdicion ? "PATCH" : "POST"

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()

      if (!res.ok) { setError(data.mensaje ?? "Error al guardar"); return }

      router.push("/coach/planes-alimenticios")
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto">
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
          {error}
        </div>
      )}

      {/* Datos generales */}
      <fieldset className="rounded-2xl p-5 space-y-4" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <legend className="text-sm font-bold px-1" style={{ color: "var(--foreground)" }}>Datos generales</legend>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
            Nombre <span style={{ color: "var(--red)" }}>*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej. Plan pérdida de grasa — Semana 1"
            className="input-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Objetivo</label>
            <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className="input-base">
              <option value="">Sin especificar</option>
              <option value="hipertrofia">Hipertrofia</option>
              <option value="perdida_grasa">Pérdida de grasa</option>
              <option value="fuerza">Fuerza</option>
              <option value="resistencia">Resistencia</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Calorías objetivo/día</label>
            <input
              type="number"
              value={calObjetivo}
              onChange={(e) => setCalObjetivo(e.target.value)}
              placeholder="2000"
              className="input-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Asignar a alumno</label>
          <select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} className="input-base">
            <option value="">Sin asignar</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className="relative h-6 w-11 rounded-full transition-colors"
            style={{ background: esTemplate ? "var(--green)" : "var(--border)" }}
            onClick={() => setEsTemplate((v) => !v)}
          >
            <span
              className="absolute top-1 h-4 w-4 rounded-full bg-white transition-transform shadow"
              style={{ transform: esTemplate ? "translateX(21px)" : "translateX(4px)" }}
            />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Guardar como template reutilizable
          </span>
        </label>

        {/* Banner templates bloqueados para plan Gratis */}
        {!tieneTemplatesDietas && (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "var(--blue-bg)", border: "1px solid var(--blue)22" }}
          >
            <BookOpen size={16} style={{ color: "var(--blue)", flexShrink: 0 }} />
            <p className="text-xs font-medium" style={{ color: "var(--blue)" }}>
              Los templates de dietas por objetivo (hipertrofia, pérdida de grasa…) están disponibles en el
              <Link href="/coach/mi-plan" className="font-bold ml-1">Plan Inicial →</Link>
            </p>
          </div>
        )}
      </fieldset>

      {/* Comidas por momento */}
      {MOMENTOS.map(({ id: momento, label, color }) => {
        const comidasMomento = comidas.filter((c) => c.momento === momento)
        const abierto = seccionesAbiertas[momento]

        return (
          <div
            key={momento}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            {/* Header colapsable */}
            <button
              type="button"
              onClick={() => toggleSeccion(momento)}
              className="w-full flex items-center justify-between px-5 py-4"
              style={{ borderBottom: abierto ? `1px solid var(--border)` : "none" }}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                  {label}
                </span>
                {comidasMomento.length > 0 && (
                  <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    ({comidasMomento.length} comida{comidasMomento.length !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
              {abierto ? <ChevronUp size={16} style={{ color: "var(--foreground-subtle)" }} /> : <ChevronDown size={16} style={{ color: "var(--foreground-subtle)" }} />}
            </button>

            {abierto && (
              <div className="px-5 pb-5 space-y-3 pt-3">
                {comidasMomento.map((c) => (
                  <div
                    key={c.tempId}
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: "var(--background)", border: "1px solid var(--border)", borderLeftWidth: "3px", borderLeftColor: color }}
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="time"
                        value={c.hora_sugerida}
                        onChange={(e) => actualizarComida(c.tempId, "hora_sugerida", e.target.value)}
                        className="input-base py-1 text-xs w-32"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarComida(c.tempId)}
                        className="btn-ghost p-1"
                        style={{ color: "var(--red)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <textarea
                      value={c.descripcion}
                      onChange={(e) => actualizarComida(c.tempId, "descripcion", e.target.value)}
                      placeholder="ej. 150g pollo a la plancha, 3/4 taza arroz integral, ensalada verde..."
                      rows={2}
                      className="input-base resize-none"
                    />

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { campo: "calorias" as keyof Comida, label: "kcal", color: "var(--orange)" },
                        { campo: "proteinas_g" as keyof Comida, label: "Prot (g)", color: "var(--blue)" },
                        { campo: "carbohidratos_g" as keyof Comida, label: "Carbs (g)", color: "var(--green)" },
                        { campo: "grasas_g" as keyof Comida, label: "Grasas (g)", color: "var(--purple)" },
                      ].map(({ campo, label: lbl, color: c2 }) => (
                        <div key={campo}>
                          <label className="block text-[10px] font-bold mb-1" style={{ color: c2 }}>{lbl}</label>
                          <input
                            type="number"
                            value={c[campo] as string}
                            onChange={(e) => actualizarComida(c.tempId, campo, e.target.value)}
                            placeholder="0"
                            className="input-base py-1.5 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => agregarComida(momento)}
                  className="flex items-center gap-1.5 rounded-xl border-dashed border px-4 py-2.5 text-xs font-semibold w-full justify-center transition-colors"
                  style={{ borderColor: color, color }}
                >
                  <Plus size={13} /> Agregar {label.toLowerCase()}
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Totales en tiempo real */}
      {comidas.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--foreground)" }}>
            Totales del día
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Calorías", valor: Math.round(totales.calorias), unidad: "kcal", color: "var(--orange)", bg: "var(--orange-bg)" },
              { label: "Proteínas", valor: Math.round(totales.proteinas), unidad: "g", color: "var(--blue)", bg: "var(--blue-bg)" },
              { label: "Carbohidratos", valor: Math.round(totales.carbohidratos), unidad: "g", color: "var(--green)", bg: "var(--green-bg)" },
              { label: "Grasas", valor: Math.round(totales.grasas), unidad: "g", color: "var(--purple)", bg: "var(--purple-bg)" },
            ].map(({ label, valor, unidad, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="text-xl font-extrabold" style={{ color, letterSpacing: "-0.02em" }}>
                  {valor}<span className="text-sm font-normal ml-0.5">{unidad}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Barra de macros (% del total calórico) */}
          {totales.calorias > 0 && (() => {
            const totalMacros = totales.proteinas * 4 + totales.carbohidratos * 4 + totales.grasas * 9
            const pProt = totalMacros > 0 ? ((totales.proteinas * 4) / totalMacros) * 100 : 0
            const pCarbs = totalMacros > 0 ? ((totales.carbohidratos * 4) / totalMacros) * 100 : 0
            const pGrasas = totalMacros > 0 ? ((totales.grasas * 9) / totalMacros) * 100 : 0
            return (
              <div className="mt-3">
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  <div style={{ width: `${pProt}%`, background: "var(--blue)" }} />
                  <div style={{ width: `${pCarbs}%`, background: "var(--green)" }} />
                  <div style={{ width: `${pGrasas}%`, background: "var(--purple)" }} />
                </div>
                <div className="flex gap-3 mt-1.5 justify-center flex-wrap">
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
          })()}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary" disabled={cargando}>Cancelar</button>
        <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
          {cargando ? <><Loader2 size={16} className="animate-spin" />Guardando...</> : <><Save size={16} />{esEdicion ? "Guardar cambios" : "Crear plan"}</>}
        </button>
      </div>
    </form>
  )
}
