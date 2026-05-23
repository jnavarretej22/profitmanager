"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Save, BookOpen, X, UtensilsCrossed } from "lucide-react"
import { usePlanOpcional } from "@/lib/plan-context"
import { useWarnCambiosSinGuardar } from "@/lib/use-warn-cambios-sin-guardar"
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

const MOMENTOS = [
  { id: "desayuno",     label: "Desayuno",      color: "var(--orange)" },
  { id: "media_manana", label: "Media mañana",   color: "#EAB308" },
  { id: "almuerzo",     label: "Almuerzo",       color: "var(--green)" },
  { id: "merienda",     label: "Merienda",       color: "var(--blue)" },
  { id: "cena",         label: "Cena",           color: "var(--purple)" },
] as const

type Momento = typeof MOMENTOS[number]["id"]

const MOMENTOS_ORDEN: Momento[] = ["desayuno","media_manana","almuerzo","merienda","cena"]

function momentoColor(m: Momento) {
  return MOMENTOS.find((x) => x.id === m)?.color ?? "var(--foreground-muted)"
}
function momentoLabel(m: Momento) {
  return MOMENTOS.find((x) => x.id === m)?.label ?? m
}

type Comida = {
  tempId:         string
  momento:        Momento
  hora_sugerida:  string
  descripcion:    string
  calorias:       string
  proteinas_g:    string
  carbohidratos_g:string
  grasas_g:       string
}

type DiaForm = {
  dia_semana:  DiaSemana
  nombre_foco: string
  es_libre:    boolean
  comidas:     Comida[]
}

type AlumnoOption = { id: string; nombre: string; apellido: string }

type TemplatePlan = {
  id:      string
  nombre:  string
  objetivo:string | null
  dias: Array<{
    dia_semana:  string
    nombre_foco: string | null
    es_libre:    boolean
    comidas:     Array<{
      momento:         string
      hora_sugerida:   string | null
      descripcion:     string
      calorias:        number | null
      proteinas_g:     number | null
      carbohidratos_g: number | null
      grasas_g:        number | null
    }>
  }>
}

interface PlanAlimenticioFormProps {
  planId?:      string
  valorInicial?: {
    nombre?:            string
    objetivo?:          string
    calorias_objetivo?: number
    es_template?:       boolean
    alumno_id?:         string | null
    fecha_fin?:         string | null
    plan_requerido?:    string | null
    dias?: Array<{
      dia_semana:  string
      nombre_foco: string | null
      es_libre:    boolean
      comidas:     Array<{
        momento:         string
        hora_sugerida:   string | null
        descripcion:     string
        calorias:        string
        proteinas_g:     string
        carbohidratos_g: string
        grasas_g:        string
      }>
    }>
  }
  alumnos: AlumnoOption[]
  // Cuando es true, el form crea/edita un template del sistema desde el panel admin.
  // Oculta selector de alumno, vigencia, toggle template y el botón "Usar template";
  // agrega selector de plan_requerido y usa endpoints /api/admin/planes-alimenticios.
  modoAdmin?: boolean
}

function nuevaComida(): Comida {
  return {
    tempId:          crypto.randomUUID(),
    momento:         "desayuno",
    hora_sugerida:   "",
    descripcion:     "",
    calorias:        "",
    proteinas_g:     "",
    carbohidratos_g: "",
    grasas_g:        "",
  }
}

function sumarMacrosDia(comidas: Comida[]) {
  return comidas.reduce(
    (acc, c) => ({
      calorias:      acc.calorias      + (parseFloat(c.calorias)       || 0),
      proteinas:     acc.proteinas     + (parseFloat(c.proteinas_g)    || 0),
      carbohidratos: acc.carbohidratos + (parseFloat(c.carbohidratos_g)|| 0),
      grasas:        acc.grasas        + (parseFloat(c.grasas_g)       || 0),
    }),
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
  )
}

function diasDesdeValorInicial(diasInit: PlanAlimenticioFormProps["valorInicial"] extends undefined ? never : NonNullable<PlanAlimenticioFormProps["valorInicial"]>["dias"]): DiaForm[] {
  if (!diasInit?.length) {
    return DIAS_SEMANA.map((d) => ({
      dia_semana:  d,
      nombre_foco: "",
      es_libre:    false,
      comidas:     [],
    }))
  }
  return DIAS_SEMANA.map((d) => {
    const found = diasInit.find((x) => x.dia_semana === d)
    return {
      dia_semana:  d,
      nombre_foco: found?.nombre_foco ?? "",
      es_libre:    found?.es_libre ?? false,
      comidas:     (found?.comidas ?? []).map((c) => ({
        tempId:          crypto.randomUUID(),
        momento:         c.momento as Momento,
        hora_sugerida:   c.hora_sugerida ?? "",
        descripcion:     c.descripcion,
        calorias:        c.calorias,
        proteinas_g:     c.proteinas_g,
        carbohidratos_g: c.carbohidratos_g,
        grasas_g:        c.grasas_g,
      })),
    }
  })
}

export function PlanAlimenticioForm({ planId, valorInicial = {}, alumnos, modoAdmin = false }: PlanAlimenticioFormProps) {
  const router = useRouter()
  const planCtx = usePlanOpcional()
  const esEdicion          = !!planId
  const tieneTemplatesDietas = modoAdmin ? false : (planCtx?.tieneFeature("templates_dietas_objetivo") ?? false)

  const [nombre,        setNombre]        = useState(valorInicial.nombre ?? "")
  const [objetivo,      setObjetivo]      = useState(valorInicial.objetivo ?? "")
  const [calObjetivo,   setCalObjetivo]   = useState(valorInicial.calorias_objetivo?.toString() ?? "")
  const [esTemplate,    setEsTemplate]    = useState(valorInicial.es_template ?? false)
  const [alumnoId,      setAlumnoId]      = useState(valorInicial.alumno_id ?? "")
  const [fechaFin,      setFechaFin]      = useState<string | null>(valorInicial.fecha_fin ?? null)
  const [planRequerido, setPlanRequerido] = useState(valorInicial.plan_requerido ?? "inicial")
  const [dias,          setDias]          = useState<DiaForm[]>(() => diasDesdeValorInicial(valorInicial.dias))
  const [diaActivo,     setDiaActivo]     = useState<DiaSemana>("lunes")

  const [cargando,           setCargando]           = useState(false)
  const [error,              setError]              = useState("")
  const [mostrarTemplates,   setMostrarTemplates]   = useState(false)
  const [templates,          setTemplates]          = useState<TemplatePlan[]>([])

  useWarnCambiosSinGuardar(
    { nombre, objetivo, calObjetivo, esTemplate, alumnoId, fechaFin, planRequerido, dias },
    !cargando,
  )
  const [cargandoTemplates,  setCargandoTemplates]  = useState(false)

  const hoy = DIAS_SEMANA[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

  // ── Helpers de días ──────────────────────────────────────────────────────
  function setDia(dia: DiaSemana, patch: Partial<DiaForm>) {
    setDias((prev) => prev.map((d) => d.dia_semana === dia ? { ...d, ...patch } : d))
  }

  // ── Helpers de comidas ───────────────────────────────────────────────────
  function agregarComida(dia: DiaSemana) {
    const dInfo = dias.find((d) => d.dia_semana === dia)!
    setDia(dia, { comidas: [...dInfo.comidas, nuevaComida()] })
  }

  function eliminarComida(dia: DiaSemana, tempId: string) {
    setDia(dia, {
      comidas: dias.find((d) => d.dia_semana === dia)!.comidas.filter((c) => c.tempId !== tempId),
    })
  }

  function moverComida(dia: DiaSemana, tempId: string, dir: "up" | "down") {
    const d   = dias.find((x) => x.dia_semana === dia)!
    const idx = d.comidas.findIndex((c) => c.tempId === tempId)
    if (dir === "up" && idx === 0) return
    if (dir === "down" && idx === d.comidas.length - 1) return
    const nuevo = [...d.comidas]
    const swap  = dir === "up" ? idx - 1 : idx + 1
    ;[nuevo[idx], nuevo[swap]] = [nuevo[swap], nuevo[idx]]
    setDia(dia, { comidas: nuevo })
  }

  function actualizarComida(dia: DiaSemana, tempId: string, campo: keyof Comida, valor: string) {
    setDia(dia, {
      comidas: dias.find((d) => d.dia_semana === dia)!.comidas.map((c) =>
        c.tempId === tempId ? { ...c, [campo]: valor } : c,
      ),
    })
  }

  // ── Templates ────────────────────────────────────────────────────────────
  async function cargarTemplates() {
    setCargandoTemplates(true)
    try {
      const url = objetivo
        ? `/api/planes-alimenticios?tipo=template&objetivo=${objetivo}`
        : "/api/planes-alimenticios?tipo=template"
      const res  = await fetch(url)
      const data = await res.json()
      setTemplates(data.planes ?? [])
      setMostrarTemplates(true)
    } catch {
      setError("No se pudieron cargar los templates")
    } finally {
      setCargandoTemplates(false)
    }
  }

  function aplicarTemplate(t: TemplatePlan) {
    if (!nombre)   setNombre(t.nombre)
    if (!objetivo) setObjetivo(t.objetivo ?? "")
    setDias(DIAS_SEMANA.map((d) => {
      const found = t.dias.find((x) => x.dia_semana === d)
      return {
        dia_semana:  d,
        nombre_foco: found?.nombre_foco ?? "",
        es_libre:    found?.es_libre ?? false,
        comidas:     (found?.comidas ?? []).map((c) => ({
          tempId:          crypto.randomUUID(),
          momento:         c.momento as Momento,
          hora_sugerida:   c.hora_sugerida ? String(c.hora_sugerida).slice(0, 5) : "",
          descripcion:     c.descripcion,
          calorias:        c.calorias?.toString() ?? "",
          proteinas_g:     c.proteinas_g?.toString() ?? "",
          carbohidratos_g: c.carbohidratos_g?.toString() ?? "",
          grasas_g:        c.grasas_g?.toString() ?? "",
        })),
      }
    }))
    setMostrarTemplates(false)
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return }

    const diasActivos = dias.filter((d) => !d.es_libre)
    for (const d of diasActivos) {
      if (d.comidas.some((c) => !c.descripcion.trim())) {
        setError(`Todas las comidas de ${DIA_NOMBRE[d.dia_semana]} deben tener descripción`)
        return
      }
    }

    setError("")
    setCargando(true)
    try {
      const body = {
        nombre,
        objetivo:          objetivo || undefined,
        calorias_objetivo: calObjetivo ? parseInt(calObjetivo) : undefined,
        es_template:       modoAdmin ? true : esTemplate,
        alumno_id:         modoAdmin ? null : (alumnoId || null),
        fecha_fin:         modoAdmin ? null : (alumnoId ? fechaFin : null),
        ...(modoAdmin && { plan_requerido: planRequerido || null }),
        // Un día sin comidas y sin marcar como libre se trata como libre al guardar
        // para que la vista de detalle no lo muestre como un día activo vacío.
        dias: dias.map((d) => {
          const esLibreEfectivo = d.es_libre || d.comidas.length === 0
          return {
            dia_semana:  d.dia_semana,
            nombre_foco: d.nombre_foco || undefined,
            es_libre:    esLibreEfectivo,
            comidas: esLibreEfectivo ? [] : d.comidas.map((c) => ({
              momento:         c.momento,
              hora_sugerida:   c.hora_sugerida || undefined,
              descripcion:     c.descripcion,
              calorias:        c.calorias        ? parseInt(c.calorias)        : undefined,
              proteinas_g:     c.proteinas_g     ? parseInt(c.proteinas_g)     : undefined,
              carbohidratos_g: c.carbohidratos_g ? parseInt(c.carbohidratos_g) : undefined,
              grasas_g:        c.grasas_g        ? parseInt(c.grasas_g)        : undefined,
            })),
          }
        }),
      }

      const baseUrl = modoAdmin ? "/api/admin/planes-alimenticios" : "/api/planes-alimenticios"
      const url     = esEdicion ? `${baseUrl}/${planId}` : baseUrl
      const method  = esEdicion ? "PATCH" : "POST"

      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()

      if (!res.ok) { setError(data.mensaje ?? "Error al guardar"); return }

      router.push(modoAdmin ? "/admin/planes-alimenticios" : "/coach/planes-alimenticios")
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  const diaData = dias.find((d) => d.dia_semana === diaActivo)!
  const totales = sumarMacrosDia(diaData.comidas)
  // Respetar el orden de inserción del usuario — usar los botones up/down para reordenar.
  // (Antes ordenábamos por MOMENTOS_ORDEN pero eso reorganizaba la lista al cambiar el
  // momento de una comida, lo que se percibía como "el orden se invierte".)
  const comidasOrdenadas = diaData.comidas

  return (
    <>
      {/* Modal de templates */}
      {mostrarTemplates && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl flex flex-col max-h-[80vh]"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-bold" style={{ color: "var(--foreground)" }}>Templates de planes</h2>
              <button onClick={() => setMostrarTemplates(false)} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {templates.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: "var(--foreground-muted)" }}>
                  Sin templates disponibles {objetivo ? `para "${objetivo}"` : ""}
                </p>
              ) : (
                templates.map((t) => {
                  const diasConComidas = t.dias.filter((d) => !d.es_libre && d.comidas.length > 0)
                  const totalComidas   = diasConComidas.reduce((s, d) => s + d.comidas.length, 0)
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
                        {diasConComidas.length} días · {totalComidas} comidas
                        {t.objetivo ? ` · ${t.objetivo}` : ""}
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
              placeholder="ej. Plan pérdida de grasa — Semana 1" className="input-base"
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
                type="number" value={calObjetivo} onChange={(e) => setCalObjetivo(e.target.value)}
                placeholder="2000" className="input-base"
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
                <select
                  value={alumnoId}
                  onChange={(e) => { setAlumnoId(e.target.value); setFechaFin(null) }}
                  className="input-base"
                >
                  <option value="">Sin asignar (guardar como borrador)</option>
                  {alumnos.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>
                  ))}
                </select>
              </div>

              {/* Vigencia — solo cuando hay alumno seleccionado */}
              {alumnoId && (
                <div className="rounded-xl p-4" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
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

              {!tieneTemplatesDietas && (
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "var(--blue-bg)", border: "1px solid var(--blue)22" }}
                >
                  <BookOpen size={16} style={{ color: "var(--blue)", flexShrink: 0 }} />
                  <p className="text-xs font-medium" style={{ color: "var(--blue)" }}>
                    Los templates de dietas por objetivo están disponibles en el
                    <Link href="/coach/mi-plan" className="font-bold ml-1">Plan Inicial →</Link>
                  </p>
                </div>
              )}
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
                Define qué coaches verán este template al crear un plan alimenticio nuevo.
              </p>
            </div>
          )}
        </fieldset>

        {/* ── Días y comidas ───────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Plan semanal</h3>
            {tieneTemplatesDietas && (
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
          <div className="flex overflow-x-auto border-b" style={{ borderColor: "var(--border)" }}>
            {DIAS_SEMANA.map((d) => {
              const dInfo    = dias.find((x) => x.dia_semana === d)!
              const esActivo = d === diaActivo
              const esHoy    = d === hoy
              const numComidas = dInfo.comidas.length
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiaActivo(d)}
                  className="flex-shrink-0 flex flex-col items-center px-4 py-3 text-xs font-bold transition-colors relative"
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
                    {DIA_LABEL[d]}
                  </span>
                  {dInfo.es_libre ? (
                    <span style={{ color: "var(--foreground-subtle)" }}>libre</span>
                  ) : (
                    <span>{numComidas} com.</span>
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

              {!diaData.es_libre && (
                <input
                  type="text"
                  value={diaData.nombre_foco}
                  onChange={(e) => setDia(diaActivo, { nombre_foco: e.target.value })}
                  placeholder="Foco del día (ej. Alta proteína, Refeed…)"
                  className="input-base flex-1 min-w-0"
                  style={{ fontSize: "0.8125rem" }}
                />
              )}

              {/* Toggle día libre */}
              <label className="flex items-center gap-2 cursor-pointer ml-auto flex-shrink-0">
                <UtensilsCrossed size={14} style={{ color: diaData.es_libre ? "var(--orange)" : "var(--foreground-subtle)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>Día libre</span>
                <div
                  className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
                  style={{ background: diaData.es_libre ? "var(--orange)" : "var(--border)" }}
                  onClick={() => setDia(diaActivo, { es_libre: !diaData.es_libre })}
                >
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow"
                    style={{ transform: diaData.es_libre ? "translateX(17px)" : "translateX(2px)" }}
                  />
                </div>
              </label>
            </div>

            {/* Contenido del día */}
            {diaData.es_libre ? (
              <div
                className="flex flex-col items-center justify-center py-10 rounded-xl"
                style={{ background: "var(--orange-bg)", border: "1px dashed var(--orange)44" }}
              >
                <UtensilsCrossed size={28} className="mb-2" style={{ color: "var(--orange)" }} />
                <p className="text-sm font-bold" style={{ color: "var(--orange)" }}>Día libre — sin plan nutricional</p>
                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                  El alumno puede comer libremente este día.
                </p>
              </div>
            ) : (
              <>
                {/* Lista de comidas */}
                <div className="space-y-3">
                  {comidasOrdenadas.map((comida, idx) => {
                    const color = momentoColor(comida.momento)
                    return (
                      <div
                        key={comida.tempId}
                        className="rounded-xl p-4 space-y-3"
                        style={{
                          background:      "var(--background)",
                          border:          "1px solid var(--border)",
                          borderLeftWidth: "3px",
                          borderLeftColor: color,
                        }}
                      >
                        {/* Fila superior: momento + hora + controles */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={comida.momento}
                            onChange={(e) => actualizarComida(diaActivo, comida.tempId, "momento", e.target.value)}
                            className="rounded-lg px-2 py-1 text-xs font-bold border-0 cursor-pointer"
                            style={{ background: color + "22", color }}
                          >
                            {MOMENTOS.map((m) => (
                              <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                          </select>

                          <input
                            type="time"
                            value={comida.hora_sugerida}
                            onChange={(e) => actualizarComida(diaActivo, comida.tempId, "hora_sugerida", e.target.value)}
                            className="input-base py-1 text-xs w-28"
                          />

                          <div className="flex items-center gap-1 ml-auto">
                            <button
                              type="button"
                              onClick={() => moverComida(diaActivo, comida.tempId, "up")}
                              disabled={idx === 0}
                              className="btn-ghost p-1 disabled:opacity-30"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moverComida(diaActivo, comida.tempId, "down")}
                              disabled={idx === diaData.comidas.length - 1}
                              className="btn-ghost p-1 disabled:opacity-30"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminarComida(diaActivo, comida.tempId)}
                              className="btn-ghost p-1"
                              style={{ color: "var(--red)" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <textarea
                          value={comida.descripcion}
                          onChange={(e) => actualizarComida(diaActivo, comida.tempId, "descripcion", e.target.value)}
                          placeholder="ej. 150g pollo a la plancha, 3/4 taza arroz integral, ensalada verde..."
                          rows={2}
                          className="input-base resize-none"
                        />

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[
                            { campo: "calorias"        as const, label: "kcal",      color: "var(--orange)" },
                            { campo: "proteinas_g"     as const, label: "Prot (g)",  color: "var(--blue)"   },
                            { campo: "carbohidratos_g" as const, label: "Carbs (g)", color: "var(--green)"  },
                            { campo: "grasas_g"        as const, label: "Grasas (g)",color: "var(--purple)" },
                          ].map(({ campo, label, color: c2 }) => (
                            <div key={campo}>
                              <label className="block text-[10px] font-bold mb-1" style={{ color: c2 }}>{label}</label>
                              <input
                                type="number"
                                value={comida[campo]}
                                onChange={(e) => actualizarComida(diaActivo, comida.tempId, campo, e.target.value)}
                                placeholder="0"
                                className="input-base py-1.5 text-sm"
                                min={0}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => agregarComida(diaActivo)}
                  className="w-full rounded-xl border-2 border-dashed py-3 text-sm font-semibold transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.color = "var(--green)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--foreground-muted)" }}
                >
                  <Plus size={14} className="inline mr-1" />
                  Agregar comida
                </button>

                {/* Totales del día */}
                {diaData.comidas.length > 0 && totales.calorias > 0 && (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-xs font-bold mb-3" style={{ color: "var(--foreground-muted)" }}>
                      Total del día
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: "Calorías",      valor: Math.round(totales.calorias),      unidad: "kcal", color: "var(--orange)", bg: "var(--orange-bg)" },
                        { label: "Proteínas",     valor: Math.round(totales.proteinas),     unidad: "g",    color: "var(--blue)",   bg: "var(--blue-bg)"   },
                        { label: "Carbohidratos", valor: Math.round(totales.carbohidratos), unidad: "g",    color: "var(--green)",  bg: "var(--green-bg)"  },
                        { label: "Grasas",        valor: Math.round(totales.grasas),        unidad: "g",    color: "var(--purple)", bg: "var(--purple-bg)" },
                      ].map(({ label, valor, unidad, color, bg }) => (
                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                          <p className="text-lg font-extrabold" style={{ color, letterSpacing: "-0.02em" }}>
                            {valor}<span className="text-xs font-normal ml-0.5">{unidad}</span>
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color }}>{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Barra de macros */}
                    {(() => {
                      const totalMacros = totales.proteinas * 4 + totales.carbohidratos * 4 + totales.grasas * 9
                      const pProt   = totalMacros > 0 ? ((totales.proteinas * 4)      / totalMacros) * 100 : 0
                      const pCarbs  = totalMacros > 0 ? ((totales.carbohidratos * 4)  / totalMacros) * 100 : 0
                      const pGrasas = totalMacros > 0 ? ((totales.grasas * 9)         / totalMacros) * 100 : 0
                      return (
                        <div className="mt-3">
                          <div className="flex h-2.5 w-full overflow-hidden rounded-full">
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
                  </div>
                )}
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
              : <><Save size={16} />{esEdicion ? "Guardar cambios" : "Crear plan"}</>}
          </button>
        </div>
      </form>
    </>
  )
}
