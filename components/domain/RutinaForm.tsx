"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Save, BookOpen, X } from "lucide-react"
import { usePlan } from "@/lib/plan-context"

const DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const
const DIAS_LABEL: Record<string, string> = {
  lunes: "L", martes: "M", miercoles: "X", jueves: "J",
  viernes: "V", sabado: "S", domingo: "D",
}

type Ejercicio = {
  tempId: string
  nombre: string
  series: number
  repeticiones: string
  descanso_segundos: number
  rpe: string
  notas: string
}

type AlumnoOption = { id: string; nombre: string; apellido: string }
type TemplateRutina = {
  id: string; nombre: string; objetivo: string
  ejercicios: Array<{ nombre: string; series: number; repeticiones: string; descanso_segundos?: number; rpe?: string; notas?: string }>
}

interface RutinaFormProps {
  rutinaId?: string
  valorInicial?: {
    nombre?: string
    descripcion?: string
    objetivo?: string
    dias_semana?: string[]
    duracion_minutos?: number
    es_template?: boolean
    alumno_id?: string | null
    ejercicios?: Omit<Ejercicio, "tempId">[]
  }
  alumnos: AlumnoOption[]
}

function nuevoEjercicio(): Ejercicio {
  return { tempId: crypto.randomUUID(), nombre: "", series: 3, repeticiones: "10", descanso_segundos: 60, rpe: "", notas: "" }
}

export function RutinaForm({ rutinaId, valorInicial = {}, alumnos }: RutinaFormProps) {
  const router = useRouter()
  const { tieneFeature } = usePlan()
  const esEdicion = !!rutinaId
  const tieneTemplates = tieneFeature("templates_rutinas")

  const [nombre, setNombre] = useState(valorInicial.nombre ?? "")
  const [descripcion, setDescripcion] = useState(valorInicial.descripcion ?? "")
  const [objetivo, setObjetivo] = useState(valorInicial.objetivo ?? "")
  const [dias, setDias] = useState<string[]>(valorInicial.dias_semana ?? [])
  const [duracion, setDuracion] = useState(valorInicial.duracion_minutos?.toString() ?? "")
  const [esTemplate, setEsTemplate] = useState(valorInicial.es_template ?? false)
  const [alumnoId, setAlumnoId] = useState(valorInicial.alumno_id ?? "")
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>(
    valorInicial.ejercicios?.map((e) => ({ ...e, tempId: crypto.randomUUID() })) ?? [nuevoEjercicio()]
  )

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")
  const [mostrarTemplates, setMostrarTemplates] = useState(false)
  const [templates, setTemplates] = useState<TemplateRutina[]>([])
  const [cargandoTemplates, setCargandoTemplates] = useState(false)

  function toggleDia(d: string) {
    setDias((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])
  }

  function agregarEjercicio() {
    setEjercicios((prev) => [...prev, nuevoEjercicio()])
  }

  function eliminarEjercicio(tempId: string) {
    setEjercicios((prev) => prev.filter((e) => e.tempId !== tempId))
  }

  function moverEjercicio(tempId: string, dir: "up" | "down") {
    setEjercicios((prev) => {
      const idx = prev.findIndex((e) => e.tempId === tempId)
      if (dir === "up" && idx === 0) return prev
      if (dir === "down" && idx === prev.length - 1) return prev
      const nuevo = [...prev]
      const swapIdx = dir === "up" ? idx - 1 : idx + 1
      ;[nuevo[idx], nuevo[swapIdx]] = [nuevo[swapIdx], nuevo[idx]]
      return nuevo
    })
  }

  function actualizarEjercicio(tempId: string, campo: keyof Ejercicio, valor: string | number) {
    setEjercicios((prev) => prev.map((e) => e.tempId === tempId ? { ...e, [campo]: valor } : e))
  }

  async function cargarTemplates() {
    setCargandoTemplates(true)
    try {
      const url = objetivo ? `/api/rutinas/templates?objetivo=${objetivo}` : "/api/rutinas/templates"
      const res = await fetch(url)
      const data = await res.json()
      setTemplates(data.templates ?? [])
      setMostrarTemplates(true)
    } catch {
      setError("No se pudieron cargar los templates")
    } finally {
      setCargandoTemplates(false)
    }
  }

  function aplicarTemplate(t: TemplateRutina) {
    if (!nombre) setNombre(t.nombre)
    if (!objetivo) setObjetivo(t.objetivo)
    setEjercicios(t.ejercicios.map((e) => ({
      tempId: crypto.randomUUID(),
      nombre: e.nombre,
      series: e.series,
      repeticiones: e.repeticiones,
      descanso_segundos: e.descanso_segundos ?? 60,
      rpe: e.rpe ?? "",
      notas: e.notas ?? "",
    })))
    setMostrarTemplates(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return }
    if (ejercicios.some((ej) => !ej.nombre.trim())) { setError("Todos los ejercicios deben tener nombre"); return }

    setError("")
    setCargando(true)
    try {
      const body = {
        nombre, descripcion, objetivo: objetivo || undefined,
        dias_semana: dias, duracion_minutos: duracion ? parseInt(duracion) : undefined,
        es_template: esTemplate, alumno_id: alumnoId || null,
        ejercicios: ejercicios.map((ej) => ({
          nombre: ej.nombre, series: ej.series,
          repeticiones: ej.repeticiones,
          descanso_segundos: ej.descanso_segundos || undefined,
          rpe: ej.rpe || undefined, notas: ej.notas || undefined,
        })),
      }

      const url = esEdicion ? `/api/rutinas/${rutinaId}` : "/api/rutinas"
      const method = esEdicion ? "PATCH" : "POST"

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()

      if (!res.ok) { setError(data.mensaje ?? "Error al guardar"); return }

      router.push("/coach/rutinas")
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      {/* Modal de templates */}
      {mostrarTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden animate-scale-in"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-bold" style={{ color: "var(--foreground)" }}>Templates de rutinas</h2>
              <button onClick={() => setMostrarTemplates(false)} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {templates.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: "var(--foreground-muted)" }}>
                  Sin templates disponibles {objetivo ? `para "${objetivo}"` : ""}
                </p>
              ) : (
                templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => aplicarTemplate(t)}
                    className="w-full text-left rounded-xl px-4 py-3 transition-colors"
                    style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--background-hover)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--background)" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{t.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                      {t.ejercicios.length} ejercicios · {t.objetivo}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
              placeholder="ej. Piernas y Glúteos — Semana A"
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Descripción opcional..."
              className="input-base resize-none"
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
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Duración (min)</label>
              <input
                type="number"
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                placeholder="60"
                className="input-base"
              />
            </div>
          </div>

          {/* Días de la semana */}
          <div>
            <label className="block text-sm font-semibold mb-2.5" style={{ color: "var(--foreground)" }}>
              Días de la semana
              {dias.length > 0 && (
                <span className="ml-2 text-xs font-normal" style={{ color: "var(--foreground-muted)" }}>
                  {dias.length} día{dias.length !== 1 ? "s" : ""} seleccionado{dias.length !== 1 ? "s" : ""}
                </span>
              )}
            </label>
            <div className="flex gap-2 flex-wrap">
              {DIAS.map((d) => {
                const activo = dias.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDia(d)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-150"
                    style={{
                      background: activo ? "var(--blue)" : "transparent",
                      color: activo ? "white" : "var(--foreground-muted)",
                      border: activo ? "none" : "1.5px solid var(--border)",
                      boxShadow: activo ? "0 3px 10px rgba(45,125,246,0.35)" : "none",
                      transform: activo ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    {DIAS_LABEL[d]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Asignar a alumno */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              Asignar a alumno
            </label>
            <select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} className="input-base">
              <option value="">Sin asignar (guardar como borrador)</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle template */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className="relative h-6 w-11 rounded-full transition-colors"
              style={{ background: esTemplate ? "var(--blue)" : "var(--border)" }}
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
        </fieldset>

        {/* Ejercicios */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              Ejercicios ({ejercicios.length})
            </h3>
            <div className="flex gap-2">
              {tieneTemplates && (
                <button
                  type="button"
                  onClick={cargarTemplates}
                  disabled={cargandoTemplates}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {cargandoTemplates ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
                  Usar template
                </button>
              )}
              <button type="button" onClick={agregarEjercicio} className="btn-primary text-xs py-1.5 px-3">
                <Plus size={13} /> Ejercicio
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {ejercicios.map((ej, idx) => (
              <div
                key={ej.tempId}
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: "var(--background)",
                  borderLeft: "3px solid var(--blue)",
                  border: "1px solid var(--border)",
                  borderLeftWidth: "3px",
                  borderLeftColor: "var(--blue)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moverEjercicio(ej.tempId, "up")}
                      disabled={idx === 0}
                      className="btn-ghost p-1 disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moverEjercicio(ej.tempId, "down")}
                      disabled={idx === ejercicios.length - 1}
                      className="btn-ghost p-1 disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarEjercicio(ej.tempId)}
                      className="btn-ghost p-1"
                      style={{ color: "var(--red)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={ej.nombre}
                  onChange={(e) => actualizarEjercicio(ej.tempId, "nombre", e.target.value)}
                  placeholder="Nombre del ejercicio *"
                  className="input-base"
                />

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>Series</label>
                    <input
                      type="number"
                      value={ej.series}
                      onChange={(e) => actualizarEjercicio(ej.tempId, "series", parseInt(e.target.value) || 1)}
                      className="input-base"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>Reps</label>
                    <input
                      type="text"
                      value={ej.repeticiones}
                      onChange={(e) => actualizarEjercicio(ej.tempId, "repeticiones", e.target.value)}
                      placeholder="10-12"
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>Descanso (s)</label>
                    <input
                      type="number"
                      value={ej.descanso_segundos}
                      onChange={(e) => actualizarEjercicio(ej.tempId, "descanso_segundos", parseInt(e.target.value) || 0)}
                      className="input-base"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>RPE</label>
                    <input
                      type="text"
                      value={ej.rpe}
                      onChange={(e) => actualizarEjercicio(ej.tempId, "rpe", e.target.value)}
                      placeholder="7-8"
                      className="input-base"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={ej.notas}
                  onChange={(e) => actualizarEjercicio(ej.tempId, "notas", e.target.value)}
                  placeholder="Notas opcionales..."
                  className="input-base"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={agregarEjercicio}
            className="w-full rounded-xl border-2 border-dashed py-3 text-sm font-semibold transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--foreground-muted)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--blue)"
              e.currentTarget.style.color = "var(--blue)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.color = "var(--foreground-muted)"
            }}
          >
            + Agregar ejercicio
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary" disabled={cargando}>
            Cancelar
          </button>
          <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
            {cargando ? <><Loader2 size={16} className="animate-spin" />Guardando...</> : <><Save size={16} />{esEdicion ? "Guardar cambios" : "Crear rutina"}</>}
          </button>
        </div>
      </form>
    </>
  )
}
