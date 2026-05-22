"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Save, BookOpen, X, Coffee } from "lucide-react"
import { usePlanOpcional } from "@/lib/plan-context"
import { VigenciaSelector } from "./VigenciaSelector"

const DIAS_SEMANA = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const
type DiaSemana = typeof DIAS_SEMANA[number]

const DIA_LABEL: Record<DiaSemana, string> = {
  lunes: "L", martes: "M", miercoles: "X", jueves: "J",
  viernes: "V", sabado: "S", domingo: "D",
}
const DIA_NOMBRE: Record<DiaSemana, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
  viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
}

type Ejercicio = {
  tempId:            string
  nombre:            string
  series:            number
  repeticiones:      string
  peso_kg:           string
  descanso_segundos: number
  rpe:               string
  progresion:        string
  notas:             string
}

type DiaForm = {
  dia_semana:  DiaSemana
  nombre_foco: string
  es_descanso: boolean
  ejercicios:  Ejercicio[]
}

type AlumnoOption     = { id: string; nombre: string; apellido: string }
type TemplateRutina   = {
  id: string; nombre: string; objetivo: string
  dias: Array<{
    dia_semana: string; nombre_foco: string | null; es_descanso: boolean
    ejercicios: Array<{ nombre: string; series: number; repeticiones: string; peso_kg?: number | string | null; descanso_segundos?: number; rpe?: string; progresion?: string; notas?: string }>
  }>
}

interface RutinaFormProps {
  rutinaId?:    string
  valorInicial?: {
    nombre?:          string
    descripcion?:     string
    objetivo?:        string
    duracion_minutos?: number
    es_template?:     boolean
    alumno_id?:       string | null
    fecha_fin?:       string | null
    plan_requerido?:  string | null
    dias?: Array<{
      dia_semana:  string
      nombre_foco?: string | null
      es_descanso?: boolean
      ejercicios?: Array<{
        nombre:            string
        series:            number
        repeticiones:      string
        peso_kg?:          string | number | null
        descanso_segundos?: number
        rpe?:              string | null
        progresion?:       string | null
        notas?:            string | null
      }>
    }>
  }
  alumnos: AlumnoOption[]
  // Cuando es true, el form crea/edita un template del sistema desde el panel admin:
  // oculta selector de alumno, toggle es_template y vigencia; añade selector de plan_requerido;
  // usa endpoints /api/admin/rutinas y redirige a /admin/rutinas.
  modoAdmin?: boolean
}

function nuevoEjercicio(): Ejercicio {
  return { tempId: crypto.randomUUID(), nombre: "", series: 3, repeticiones: "10", peso_kg: "", descanso_segundos: 60, rpe: "", progresion: "", notas: "" }
}

function diasDesdeValorInicial(diasInit: RutinaFormProps["valorInicial"] extends undefined ? never : NonNullable<RutinaFormProps["valorInicial"]>["dias"]): DiaForm[] {
  if (!diasInit?.length) {
    // Por defecto: lunes a viernes activos
    return DIAS_SEMANA.map((d) => ({
      dia_semana:  d,
      nombre_foco: "",
      es_descanso: d === "sabado" || d === "domingo",
      ejercicios:  [],
    }))
  }
  return DIAS_SEMANA.map((d) => {
    const found = diasInit.find((x) => x.dia_semana === d)
    return {
      dia_semana:  d,
      nombre_foco: found?.nombre_foco ?? "",
      es_descanso: found?.es_descanso ?? (d === "sabado" || d === "domingo"),
      ejercicios:  (found?.ejercicios ?? []).map((e) => ({
        tempId:            crypto.randomUUID(),
        nombre:            e.nombre,
        series:            e.series,
        repeticiones:      e.repeticiones,
        peso_kg:           e.peso_kg != null ? String(e.peso_kg) : "",
        descanso_segundos: e.descanso_segundos ?? 60,
        rpe:               e.rpe ?? "",
        progresion:        e.progresion ?? "",
        notas:             e.notas ?? "",
      })),
    }
  })
}

export function RutinaForm({ rutinaId, valorInicial = {}, alumnos, modoAdmin = false }: RutinaFormProps) {
  const router = useRouter()
  const planCtx = usePlanOpcional()
  const esEdicion      = !!rutinaId
  // En modo admin, los templates siempre están disponibles. En modo coach, depende del plan.
  const tieneTemplates = modoAdmin ? false : (planCtx?.tieneFeature("templates_rutinas") ?? false)

  const [nombre,         setNombre]         = useState(valorInicial.nombre ?? "")
  const [descripcion,    setDescripcion]    = useState(valorInicial.descripcion ?? "")
  const [objetivo,       setObjetivo]       = useState(valorInicial.objetivo ?? "")
  const [duracion,       setDuracion]       = useState(valorInicial.duracion_minutos?.toString() ?? "")
  const [esTemplate,     setEsTemplate]     = useState(valorInicial.es_template ?? false)
  const [alumnoId,       setAlumnoId]       = useState(valorInicial.alumno_id ?? "")
  const [fechaFin,       setFechaFin]       = useState<string | null>(valorInicial.fecha_fin ?? null)
  const [planRequerido,  setPlanRequerido]  = useState(valorInicial.plan_requerido ?? "inicial")
  const [dias,           setDias]           = useState<DiaForm[]>(() => diasDesdeValorInicial(valorInicial.dias))
  const [diaActivo,      setDiaActivo]      = useState<DiaSemana>("lunes")

  const [cargando,          setCargando]          = useState(false)
  const [error,             setError]             = useState("")
  const [mostrarTemplates,  setMostrarTemplates]  = useState(false)
  const [templates,         setTemplates]         = useState<TemplateRutina[]>([])
  const [cargandoTemplates, setCargandoTemplates] = useState(false)

  const hoy = DIAS_SEMANA[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

  // ── Helpers de días ──────────────────────────────────────────────────────
  function setDia(dia: DiaSemana, patch: Partial<DiaForm>) {
    setDias((prev) => prev.map((d) => d.dia_semana === dia ? { ...d, ...patch } : d))
  }

  // ── Helpers de ejercicios ────────────────────────────────────────────────
  function agregarEjercicio(dia: DiaSemana) {
    setDia(dia, {
      ejercicios: [...dias.find((d) => d.dia_semana === dia)!.ejercicios, nuevoEjercicio()],
    })
  }

  function eliminarEjercicio(dia: DiaSemana, tempId: string) {
    setDia(dia, {
      ejercicios: dias.find((d) => d.dia_semana === dia)!.ejercicios.filter((e) => e.tempId !== tempId),
    })
  }

  function moverEjercicio(dia: DiaSemana, tempId: string, dir: "up" | "down") {
    const d = dias.find((x) => x.dia_semana === dia)!
    const idx = d.ejercicios.findIndex((e) => e.tempId === tempId)
    if (dir === "up" && idx === 0) return
    if (dir === "down" && idx === d.ejercicios.length - 1) return
    const nuevo = [...d.ejercicios]
    const swap  = dir === "up" ? idx - 1 : idx + 1
    ;[nuevo[idx], nuevo[swap]] = [nuevo[swap], nuevo[idx]]
    setDia(dia, { ejercicios: nuevo })
  }

  function actualizarEjercicio(dia: DiaSemana, tempId: string, campo: keyof Ejercicio, valor: string | number) {
    setDia(dia, {
      ejercicios: dias.find((d) => d.dia_semana === dia)!.ejercicios.map((e) =>
        e.tempId === tempId ? { ...e, [campo]: valor } : e,
      ),
    })
  }

  // ── Templates ────────────────────────────────────────────────────────────
  async function cargarTemplates() {
    setCargandoTemplates(true)
    try {
      const url = objetivo ? `/api/rutinas/templates?objetivo=${objetivo}` : "/api/rutinas/templates"
      const res  = await fetch(url)
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
    setDias(DIAS_SEMANA.map((d) => {
      const found = t.dias.find((x) => x.dia_semana === d)
      return {
        dia_semana:  d,
        nombre_foco: found?.nombre_foco ?? "",
        es_descanso: found?.es_descanso ?? (d === "sabado" || d === "domingo"),
        ejercicios:  (found?.ejercicios ?? []).map((e) => ({
          tempId:            crypto.randomUUID(),
          nombre:            e.nombre,
          series:            e.series,
          repeticiones:      e.repeticiones,
          peso_kg:           e.peso_kg != null ? String(e.peso_kg) : "",
          descanso_segundos: e.descanso_segundos ?? 60,
          rpe:               e.rpe ?? "",
          progresion:        e.progresion ?? "",
          notas:             e.notas ?? "",
        })),
      }
    }))
    setMostrarTemplates(false)
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return }

    const diasActivos = dias.filter((d) => !d.es_descanso)
    for (const d of diasActivos) {
      if (d.ejercicios.some((ej) => !ej.nombre.trim())) {
        setError(`Todos los ejercicios de ${DIA_NOMBRE[d.dia_semana]} deben tener nombre`)
        return
      }
    }

    setError("")
    setCargando(true)
    try {
      const body = {
        nombre,
        descripcion,
        objetivo:         objetivo || undefined,
        duracion_minutos: duracion ? parseInt(duracion) : undefined,
        es_template:      modoAdmin ? true : esTemplate,
        alumno_id:        modoAdmin ? null : (alumnoId || null),
        fecha_fin:        modoAdmin ? null : (alumnoId ? fechaFin : null),
        ...(modoAdmin && { plan_requerido: planRequerido || null }),
        dias: dias.map((d) => ({
          dia_semana:  d.dia_semana,
          nombre_foco: d.nombre_foco || undefined,
          es_descanso: d.es_descanso,
          ejercicios:  d.es_descanso ? [] : d.ejercicios.map((ej) => ({
            nombre:            ej.nombre,
            series:            ej.series,
            repeticiones:      ej.repeticiones,
            peso_kg:           ej.peso_kg.trim() ? parseFloat(ej.peso_kg) : undefined,
            descanso_segundos: ej.descanso_segundos || undefined,
            rpe:               ej.rpe || undefined,
            progresion:        ej.progresion || undefined,
            notas:             ej.notas || undefined,
          })),
        })),
      }

      const baseUrl = modoAdmin ? "/api/admin/rutinas" : "/api/rutinas"
      const url     = esEdicion ? `${baseUrl}/${rutinaId}` : baseUrl
      const method  = esEdicion ? "PATCH" : "POST"

      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()

      if (!res.ok) { setError(data.mensaje ?? "Error al guardar"); return }

      router.push(modoAdmin ? "/admin/rutinas" : "/coach/rutinas")
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  const diaData = dias.find((d) => d.dia_semana === diaActivo)!

  return (
    <>
      {/* Modal de templates */}
      {mostrarTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl flex flex-col max-h-[80vh]"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-bold" style={{ color: "var(--foreground)" }}>Templates de rutinas</h2>
              <button onClick={() => setMostrarTemplates(false)} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {templates.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: "var(--foreground-muted)" }}>
                  Sin templates disponibles {objetivo ? `para "${objetivo}"` : ""}
                </p>
              ) : (
                templates.map((t) => {
                  const diasActivos = t.dias.filter((d) => !d.es_descanso)
                  const totalEj     = diasActivos.reduce((s, d) => s + d.ejercicios.length, 0)
                  return (
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
                        {diasActivos.length} días activos · {totalEj} ejercicios · {t.objetivo}
                      </p>
                    </button>
                  )
                })
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

        {/* ── Datos generales ──────────────────────────────────────────── */}
        <fieldset
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <legend className="text-sm font-bold px-1" style={{ color: "var(--foreground)" }}>Datos generales</legend>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
              Nombre <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Rutina Full Body — Hipertrofia" className="input-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Descripción</label>
            <textarea
              value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              rows={2} placeholder="Descripción opcional..." className="input-base resize-none"
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
                type="number" value={duracion} onChange={(e) => setDuracion(e.target.value)}
                placeholder="60" className="input-base"
              />
            </div>
          </div>

          {!modoAdmin && (
            <>
              {/* Asignar a alumno */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
                  Asignar a alumno
                </label>
                <select value={alumnoId} onChange={(e) => { setAlumnoId(e.target.value); setFechaFin(null) }} className="input-base">
                  <option value="">Sin asignar (guardar como borrador)</option>
                  {alumnos.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>
                  ))}
                </select>
              </div>

              {/* Vigencia — solo cuando hay alumno seleccionado */}
              {alumnoId && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                >
                  <VigenciaSelector value={fechaFin} onChange={setFechaFin} />
                </div>
              )}

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
            </>
          )}

          {modoAdmin && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
                Plan requerido
              </label>
              <select value={planRequerido} onChange={(e) => setPlanRequerido(e.target.value)} className="input-base">
                <option value="gratis">Gratis (todos los coaches pueden usarlo)</option>
                <option value="inicial">Inicial (solo coaches con plan Inicial)</option>
              </select>
              <p className="mt-1 text-xs" style={{ color: "var(--foreground-subtle)" }}>
                Define qué coaches verán este template al crear una rutina nueva.
              </p>
            </div>
          )}
        </fieldset>

        {/* ── Días y ejercicios ────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          {/* Cabecera */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              Programa semanal
            </h3>
            {tieneTemplates && (
              <button
                type="button" onClick={cargarTemplates} disabled={cargandoTemplates}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                {cargandoTemplates ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
                Usar template
              </button>
            )}
          </div>

          {/* Tabs de días */}
          <div
            className="flex overflow-x-auto border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {DIAS_SEMANA.map((d) => {
              const dInfo      = dias.find((x) => x.dia_semana === d)!
              const esActivo   = d === diaActivo
              const esHoy      = d === hoy
              const numEjs     = dInfo.ejercicios.length
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiaActivo(d)}
                  className="flex-shrink-0 flex flex-col items-center px-4 py-3 text-xs font-bold transition-colors relative"
                  style={{
                    color: esActivo ? "var(--blue)" : "var(--foreground-muted)",
                    borderBottom: esActivo ? "2px solid var(--blue)" : "2px solid transparent",
                    background:   esActivo ? "var(--blue-bg)" : "transparent",
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full mb-1 font-extrabold"
                    style={{
                      background: esHoy && esActivo ? "var(--blue)" : esHoy ? "var(--blue)22" : "transparent",
                      color:      esHoy && esActivo ? "white" : esActivo ? "var(--blue)" : "var(--foreground-muted)",
                    }}
                  >
                    {DIA_LABEL[d]}
                  </span>
                  {dInfo.es_descanso ? (
                    <span style={{ color: "var(--foreground-subtle)" }}>—</span>
                  ) : (
                    <span>{numEjs} ej.</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Panel del día activo */}
          <div className="p-5 space-y-4">
            {/* Header del día */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-extrabold" style={{ color: "var(--foreground)" }}>
                {DIA_NOMBRE[diaActivo]}
              </span>

              {/* Input foco */}
              {!diaData.es_descanso && (
                <input
                  type="text"
                  value={diaData.nombre_foco}
                  onChange={(e) => setDia(diaActivo, { nombre_foco: e.target.value })}
                  placeholder="Foco del día (ej. Pecho, Pierna…)"
                  className="input-base flex-1 min-w-0"
                  style={{ fontSize: "0.8125rem" }}
                />
              )}

              {/* Toggle descanso */}
              <label className="flex items-center gap-2 cursor-pointer ml-auto flex-shrink-0">
                <Coffee size={14} style={{ color: diaData.es_descanso ? "var(--orange)" : "var(--foreground-subtle)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>Descanso</span>
                <div
                  className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
                  style={{ background: diaData.es_descanso ? "var(--orange)" : "var(--border)" }}
                  onClick={() => setDia(diaActivo, { es_descanso: !diaData.es_descanso })}
                >
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow"
                    style={{ transform: diaData.es_descanso ? "translateX(17px)" : "translateX(2px)" }}
                  />
                </div>
              </label>
            </div>

            {/* Contenido del día */}
            {diaData.es_descanso ? (
              <div
                className="flex flex-col items-center justify-center py-10 rounded-xl"
                style={{ background: "var(--orange-bg)", border: "1px dashed var(--orange)44" }}
              >
                <Coffee size={28} className="mb-2" style={{ color: "var(--orange)" }} />
                <p className="text-sm font-bold" style={{ color: "var(--orange)" }}>Día de descanso</p>
                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                  La recuperación también es parte del entrenamiento.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {diaData.ejercicios.map((ej, idx) => (
                    <div
                      key={ej.tempId}
                      className="rounded-xl p-4 space-y-3"
                      style={{
                        background:      "var(--background)",
                        border:          "1px solid var(--border)",
                        borderLeft:      "3px solid var(--blue)",
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
                            onClick={() => moverEjercicio(diaActivo, ej.tempId, "up")}
                            disabled={idx === 0}
                            className="btn-ghost p-1 disabled:opacity-30"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moverEjercicio(diaActivo, ej.tempId, "down")}
                            disabled={idx === diaData.ejercicios.length - 1}
                            className="btn-ghost p-1 disabled:opacity-30"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarEjercicio(diaActivo, ej.tempId)}
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
                        onChange={(e) => actualizarEjercicio(diaActivo, ej.tempId, "nombre", e.target.value)}
                        placeholder="Nombre del ejercicio *"
                        className="input-base"
                      />

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>Series</label>
                          <input
                            type="number"
                            value={ej.series}
                            onChange={(e) => actualizarEjercicio(diaActivo, ej.tempId, "series", parseInt(e.target.value) || 1)}
                            className="input-base" min={1}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>Reps</label>
                          <input
                            type="text"
                            value={ej.repeticiones}
                            onChange={(e) => actualizarEjercicio(diaActivo, ej.tempId, "repeticiones", e.target.value)}
                            placeholder="10-12" className="input-base"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>Carga (kg)</label>
                          <input
                            type="number"
                            value={ej.peso_kg}
                            onChange={(e) => actualizarEjercicio(diaActivo, ej.tempId, "peso_kg", e.target.value)}
                            placeholder="ej. 60" className="input-base" min={0} step={0.5}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>Descanso (s)</label>
                          <input
                            type="number"
                            value={ej.descanso_segundos}
                            onChange={(e) => actualizarEjercicio(diaActivo, ej.tempId, "descanso_segundos", parseInt(e.target.value) || 0)}
                            className="input-base" min={0}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>RPE</label>
                          <input
                            type="text"
                            value={ej.rpe}
                            onChange={(e) => actualizarEjercicio(diaActivo, ej.tempId, "rpe", e.target.value)}
                            placeholder="7-8" className="input-base"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={ej.progresion}
                          onChange={(e) => actualizarEjercicio(diaActivo, ej.tempId, "progresion", e.target.value)}
                          placeholder="Progresión (ej. +2.5kg/sem)"
                          className="input-base"
                          maxLength={80}
                        />
                        <input
                          type="text"
                          value={ej.notas}
                          onChange={(e) => actualizarEjercicio(diaActivo, ej.tempId, "notas", e.target.value)}
                          placeholder="Notas opcionales..." className="input-base"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => agregarEjercicio(diaActivo)}
                  className="w-full rounded-xl border-2 border-dashed py-3 text-sm font-semibold transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.color = "var(--blue)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--foreground-muted)" }}
                >
                  <Plus size={14} className="inline mr-1" />
                  Agregar ejercicio
                </button>
              </>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary" disabled={cargando}>
            Cancelar
          </button>
          <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
            {cargando
              ? <><Loader2 size={16} className="animate-spin" />Guardando...</>
              : <><Save size={16} />{esEdicion ? "Guardar cambios" : "Crear rutina"}</>}
          </button>
        </div>
      </form>
    </>
  )
}
