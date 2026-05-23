"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2, Dumbbell, UtensilsCrossed, BarChart2, Lock, Clock, Flame, Target, Zap, Plus, Coffee, X, BookOpen, CalendarClock, Activity } from "lucide-react"
import { AlumnoForm } from "./AlumnoForm"
import { MedicionForm, HistorialMediciones } from "./MedicionForm"
import { VigenciaSelector } from "./VigenciaSelector"
import { AdherenciaPanel } from "./AdherenciaPanel"
import { Badge } from "@/components/ui"
import type { Medicion } from "@prisma/client"

type Tab = "perfil" | "mediciones" | "rutina" | "plan_alimenticio" | "adherencia" | "progreso"

const TABS: { id: Tab; label: string; icono: React.ElementType }[] = [
  { id: "perfil",           label: "Perfil",     icono: Target          },
  { id: "mediciones",       label: "Mediciones", icono: Flame           },
  { id: "rutina",           label: "Rutina",     icono: Dumbbell        },
  { id: "plan_alimenticio", label: "Nutrición",  icono: UtensilsCrossed },
  { id: "adherencia",       label: "Adherencia", icono: Activity        },
  { id: "progreso",         label: "Progreso",   icono: BarChart2       },
]

const DIAS_SEMANA = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const
const DIA_CORTO: Record<string, string> = {
  lunes: "L", martes: "M", miercoles: "X", jueves: "J",
  viernes: "V", sabado: "S", domingo: "D",
}
const DIA_NOMBRE: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
  viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
}

const MOMENTOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno", media_manana: "Media mañana",
  almuerzo: "Almuerzo", merienda: "Merienda", cena: "Cena",
}
const MOMENTOS_ORDEN = ["desayuno","media_manana","almuerzo","merienda","cena"]
const MOMENTO_COLOR: Record<string, string> = {
  desayuno: "var(--orange)", media_manana: "#EAB308",
  almuerzo: "var(--green)",  merienda: "var(--blue)", cena: "var(--purple)",
}

type EjercicioData = {
  id: string; orden: number; nombre: string; series: number | null;
  repeticiones: string | null; peso_kg?: string | number | null;
  descanso_segundos?: number | null;
  rpe?: string | null; progresion?: string | null; notas?: string | null
}

type DiaRutinaData = {
  id: string; dia_semana: string; nombre_foco: string | null;
  es_descanso: boolean; orden: number;
  ejercicios: EjercicioData[]
}

type ComidaData = {
  id: string; momento: string; hora_sugerida: string | null;
  descripcion: string; calorias?: number | null;
  proteinas_g?: number | null; carbohidratos_g?: number | null; grasas_g?: number | null
}

type DiaPlanData = {
  id: string; dia_semana: string; nombre_foco: string | null;
  es_libre: boolean; orden: number;
  comidas: ComidaData[]
}

type TemplateRutina  = { id: string; nombre: string; objetivo: string | null; dias: DiaRutinaData[] }
type TemplatePlan    = {
  id: string; nombre: string; objetivo: string | null
  dias: { dia_semana: string; es_libre: boolean; comidas: { id: string }[] }[]
}

type RutinaData = {
  id: string; nombre: string; descripcion?: string | null;
  duracion_minutos?: number | null; dias: DiaRutinaData[]
  fecha_fin?: string | null; objetivo?: string | null
}

interface AlumnoDetailTabsProps {
  alumno: {
    id: string; nombre: string; apellido: string; email: string; telefono: string;
    identificacion: string; fecha_nacimiento: string; genero: string;
    altura_cm: string; peso_inicial_kg: string; objetivo: string;
    fecha_inicio: string; notas_medicas: string; activo: boolean
  }
  mediciones: Medicion[]
  rutinas: RutinaData[]
  plan: {
    id: string; nombre: string; calorias_objetivo?: number | null;
    fecha_fin?: string | null; dias: DiaPlanData[]
  } | null
  coachPlan:      string
  esSoloLectura:  boolean
  alumnoObjetivo?: string
}

export function AlumnoDetailTabs({
  alumno, mediciones: medicionesIniciales, rutinas, plan, coachPlan, esSoloLectura, alumnoObjetivo,
}: AlumnoDetailTabsProps) {
  const router = useRouter()
  const [tabActiva,     setTabActiva]     = useState<Tab>("perfil")
  const [mediciones,    setMediciones]    = useState<Medicion[]>(medicionesIniciales)
  const [archivando,    setArchivando]    = useState(false)
  const [modalArchivar, setModalArchivar] = useState(false)

  const hoy = DIAS_SEMANA[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

  // ── Rutina ───────────────────────────────────────────────────────────────
  const [modalAsignar,          setModalAsignar]          = useState(false)
  const [templates,              setTemplates]              = useState<TemplateRutina[]>([])
  const [cargandoTemplates,      setCargandoTemplates]      = useState(false)
  const [asignando,              setAsignando]              = useState(false)
  const [fechaFinAsignar,        setFechaFinAsignar]        = useState<string | null>(null)
  const [diaVista,               setDiaVista]               = useState<string>(hoy)
  const [rutinaActivaId,         setRutinaActivaId]         = useState<string | null>(rutinas[0]?.id ?? null)
  const rutinaActiva = rutinas.find((r) => r.id === rutinaActivaId) ?? rutinas[0] ?? null

  // ── Plan alimenticio ─────────────────────────────────────────────────────
  const [modalAsignarPlan,       setModalAsignarPlan]       = useState(false)
  const [templatesPlanes,        setTemplatesPlanes]        = useState<TemplatePlan[]>([])
  const [cargandoTemplatesPlanes,setCargandoTemplatesPlanes]= useState(false)
  const [asignandoPlan,          setAsignandoPlan]          = useState(false)
  const [fechaFinAsignarPlan,    setFechaFinAsignarPlan]    = useState<string | null>(null)
  const [diaPlanVista,           setDiaPlanVista]           = useState<string>(hoy)

  const tieneGraficas = coachPlan === "inicial"

  // ── Rutina helpers ───────────────────────────────────────────────────────
  async function abrirModalAsignar() {
    setModalAsignar(true)
    if (templates.length === 0) {
      setCargandoTemplates(true)
      try {
        const res  = await fetch("/api/rutinas?tipo=template")
        const data = await res.json()
        setTemplates(data.rutinas ?? [])
      } finally {
        setCargandoTemplates(false)
      }
    }
  }

  async function asignarTemplate(templateId: string) {
    setAsignando(true)
    try {
      const res = await fetch(`/api/rutinas/${templateId}/asignar`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ alumno_id: alumno.id, fecha_fin: fechaFinAsignar }),
      })
      if (res.ok) { setModalAsignar(false); setFechaFinAsignar(null); router.refresh() }
    } finally {
      setAsignando(false)
    }
  }

  // ── Plan alimenticio helpers ─────────────────────────────────────────────
  async function abrirModalAsignarPlan() {
    setModalAsignarPlan(true)
    if (templatesPlanes.length === 0) {
      setCargandoTemplatesPlanes(true)
      try {
        const res  = await fetch("/api/planes-alimenticios?tipo=template")
        const data = await res.json()
        setTemplatesPlanes(data.planes ?? [])
      } finally {
        setCargandoTemplatesPlanes(false)
      }
    }
  }

  async function asignarTemplatePlan(templateId: string) {
    setAsignandoPlan(true)
    try {
      const res = await fetch(`/api/planes-alimenticios/${templateId}/asignar`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ alumno_id: alumno.id, fecha_fin: fechaFinAsignarPlan }),
      })
      if (res.ok) { setModalAsignarPlan(false); setFechaFinAsignarPlan(null); router.refresh() }
    } finally {
      setAsignandoPlan(false)
    }
  }

  async function archivarAlumno() {
    setArchivando(true)
    try {
      await fetch(`/api/alumnos/${alumno.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: false }),
      })
      router.push("/coach/alumnos")
    } finally {
      setArchivando(false)
      setModalArchivar(false)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b mb-5 gap-1 px-0.5" style={{ borderColor: "var(--border)" }}>
        {TABS.map(({ id, label, icono: Icono }) => (
          <button
            key={id}
            onClick={() => setTabActiva(id)}
            className="flex items-center gap-1.5 px-3.5 py-3 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-all"
            style={{
              borderColor: tabActiva === id ? "var(--blue)" : "transparent",
              color: tabActiva === id ? "var(--blue)" : "var(--foreground-muted)",
            }}
          >
            <Icono size={13} />
            {label}
            {id === "progreso" && !tieneGraficas && (
              <Lock size={11} className="ml-0.5" style={{ color: "var(--orange)" }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Perfil ── */}
      {tabActiva === "perfil" && (
        <div className="space-y-5">
          {!esSoloLectura ? (
            <AlumnoForm alumnoId={alumno.id} valorInicial={alumno} onExito={() => router.refresh()} />
          ) : (
            <div className="rounded-2xl p-5" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Tu plan está en modo solo lectura. No puedes editar datos.
              </p>
            </div>
          )}
          {alumno.activo && !esSoloLectura && (
            <div
              className="rounded-2xl px-5 py-4 flex items-center justify-between"
              style={{ background: "var(--red-bg)", border: "1px solid var(--red)22" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--red)" }}>Zona de peligro</p>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  Archivar no elimina datos, solo oculta al alumno de la lista activa.
                </p>
              </div>
              <button
                onClick={() => setModalArchivar(true)}
                className="btn-secondary text-sm py-2"
                style={{ color: "var(--red)", borderColor: "var(--red)44" }}
              >
                <Trash2 size={14} /> Archivar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Mediciones ── */}
      {tabActiva === "mediciones" && (
        <div className="space-y-5">
          {!esSoloLectura && (
            <MedicionForm alumnoId={alumno.id} onNuevaMedicion={(m) => setMediciones((prev) => [m, ...prev])} />
          )}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Historial de mediciones</h3>
            </div>
            <div className="px-5 py-3">
              <HistorialMediciones mediciones={mediciones} />
            </div>
          </div>
        </div>
      )}

      {/* ── Rutina ── */}
      {tabActiva === "rutina" && (
        <div className="space-y-4">
          {rutinaActiva ? (
            <>
              {/* Selector de rutina + acción para agregar más */}
              <div className="flex flex-wrap items-center gap-2">
                {rutinas.length > 1 && (
                  <>
                    <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: "var(--foreground-subtle)" }}>
                      {rutinas.length} activas
                    </span>
                    {rutinas.map((r) => {
                      const activo = r.id === rutinaActiva.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRutinaActivaId(r.id)}
                          className="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
                          style={{
                            background: activo ? "var(--blue)" : "var(--background-card)",
                            color:      activo ? "white" : "var(--foreground-muted)",
                            border:     `1px solid ${activo ? "var(--blue)" : "var(--border)"}`,
                          }}
                        >
                          {r.nombre}
                        </button>
                      )
                    })}
                  </>
                )}
                {!esSoloLectura && (
                  <button onClick={abrirModalAsignar} className="rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition" style={{ background: "var(--blue-bg)", color: "var(--blue)", border: "1px dashed var(--blue)" }}>
                    <Plus size={12} /> Agregar rutina
                  </button>
                )}
              </div>

              <div className="rounded-2xl p-5" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--blue-bg)" }}>
                      <Dumbbell size={18} style={{ color: "var(--blue)" }} />
                    </span>
                    <div>
                      <p className="font-bold" style={{ color: "var(--foreground)" }}>{rutinaActiva.nombre}</p>
                      {rutinaActiva.descripcion && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{rutinaActiva.descripcion}</p>
                      )}
                    </div>
                  </div>
                  {!esSoloLectura && (
                    <Link href={`/coach/rutinas/${rutinaActiva.id}`} className="btn-ghost text-xs py-1.5 px-3">Editar</Link>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {rutinaActiva.duracion_minutos && (
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
                      <Clock size={12} /> {rutinaActiva.duracion_minutos} min por sesión
                    </span>
                  )}
                  {rutinaActiva.fecha_fin && (() => {
                    const fin     = new Date(rutinaActiva.fecha_fin + "T12:00:00")
                    const vencida = fin < new Date()
                    return (
                      <span
                        className="flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-0.5"
                        style={{
                          background: vencida ? "var(--red-bg, #FEF2F2)" : "var(--orange-bg)",
                          color:      vencida ? "var(--red)" : "var(--orange)",
                        }}
                      >
                        <CalendarClock size={11} />
                        {vencida ? "Vigencia vencida" : `Hasta el ${fin.toLocaleDateString("es-EC", { day: "numeric", month: "short" })}`}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Navegación por días */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                <div className="flex overflow-x-auto border-b" style={{ borderColor: "var(--border)" }}>
                  {DIAS_SEMANA.map((d) => {
                    const diaInfo  = rutinaActiva.dias.find((x) => x.dia_semana === d)
                    const esActivo = d === diaVista
                    const esHoy    = d === hoy
                    const numEjs   = diaInfo?.ejercicios.length ?? 0
                    return (
                      <button key={d} type="button" onClick={() => setDiaVista(d)}
                        className="flex-shrink-0 flex flex-col items-center px-3 py-3 text-xs font-bold transition-colors"
                        style={{
                          color:        esActivo ? "var(--blue)" : "var(--foreground-muted)",
                          borderBottom: esActivo ? "2px solid var(--blue)" : "2px solid transparent",
                          background:   esActivo ? "var(--blue-bg)" : "transparent",
                        }}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full mb-0.5 font-extrabold"
                          style={{
                            background: esHoy && esActivo ? "var(--blue)" : "transparent",
                            color:      esHoy && esActivo ? "white" : esActivo ? "var(--blue)" : "var(--foreground-muted)",
                          }}
                        >{DIA_CORTO[d]}</span>
                        {diaInfo?.es_descanso ? (
                          <span style={{ color: "var(--foreground-subtle)", fontSize: "9px" }}>DESC</span>
                        ) : diaInfo ? (
                          <span style={{ fontSize: "9px" }}>{numEjs} ej.</span>
                        ) : (
                          <span style={{ color: "var(--foreground-subtle)", fontSize: "9px" }}>—</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {(() => {
                  const diaInfo = rutinaActiva.dias.find((d) => d.dia_semana === diaVista)
                  if (!diaInfo) return (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No hay datos para {DIA_NOMBRE[diaVista]}.</p>
                    </div>
                  )
                  if (diaInfo.es_descanso) return (
                    <div className="flex flex-col items-center justify-center py-10 px-5">
                      <Coffee size={28} className="mb-2" style={{ color: "var(--orange)" }} />
                      <p className="text-sm font-bold mb-1" style={{ color: "var(--orange)" }}>{DIA_NOMBRE[diaVista]} — Día de descanso</p>
                      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>La recuperación también es parte del entrenamiento.</p>
                    </div>
                  )
                  return (
                    <div>
                      {diaInfo.nombre_foco && (
                        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-subtle)" }}>{DIA_NOMBRE[diaVista]}</p>
                          <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{diaInfo.nombre_foco}</p>
                        </div>
                      )}
                      {diaInfo.ejercicios.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Sin ejercicios para este día.</p>
                        </div>
                      ) : (
                        <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                          {diaInfo.ejercicios.map((ej) => (
                            <li key={ej.id} className="flex items-start gap-3.5 px-5 py-4">
                              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold"
                                style={{ background: "var(--blue)", color: "white", boxShadow: "0 2px 6px rgba(45,125,246,0.35)" }}
                              >{ej.orden}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>{ej.nombre}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {ej.series != null && (
                                    <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--blue-bg)", color: "var(--blue)" }}>
                                      <Dumbbell size={10} /> {ej.series} series
                                    </span>
                                  )}
                                  {ej.repeticiones && (
                                    <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--green-bg)", color: "var(--green)" }}>
                                      <Zap size={10} /> {ej.repeticiones} reps
                                    </span>
                                  )}
                                  {ej.peso_kg != null && (
                                    <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold" style={{ background: "var(--red-bg, #FEF2F2)", color: "var(--red)" }}>
                                      {ej.peso_kg.toString()} kg
                                    </span>
                                  )}
                                  {ej.descanso_segundos != null && (
                                    <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--orange-bg)", color: "var(--orange)" }}>
                                      <Clock size={10} /> {ej.descanso_segundos}s
                                    </span>
                                  )}
                                  {ej.rpe && (
                                    <span className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}>
                                      <Target size={10} /> RPE {ej.rpe}
                                    </span>
                                  )}
                                </div>
                                {ej.progresion && (
                                  <p className="text-xs mt-1.5 font-semibold" style={{ color: "var(--blue)" }}>↗ {ej.progresion}</p>
                                )}
                                {ej.notas && (
                                  <p className="text-xs mt-1.5 italic" style={{ color: "var(--foreground-subtle)" }}>💡 {ej.notas}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })()}
              </div>
            </>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
              <div className="relative mb-4 flex items-center justify-center">
                <div className="absolute h-20 w-20 rounded-full" style={{ background: "rgba(45,125,246,0.10)" }} />
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--blue-bg)" }}>
                  <Dumbbell size={26} style={{ color: "var(--blue)" }} />
                </span>
              </div>
              <p className="font-bold mb-1" style={{ color: "var(--foreground)" }}>Sin rutina asignada</p>
              <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>¡Dale forma al potencial de este alumno! Asígnale una rutina.</p>
              {!esSoloLectura && (
                <div className="flex gap-2 justify-center">
                  <button onClick={abrirModalAsignar} className="btn-primary text-sm"><BookOpen size={14} /> Asignar rutina</button>
                  <Link href={`/coach/rutinas/nueva?alumno_id=${alumno.id}`} className="btn-secondary text-sm"><Plus size={14} /> Crear personalizada</Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal asignar rutina */}
      {modalAsignar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-md rounded-2xl flex flex-col max-h-[85vh]" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Asignar rutina</h2>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Elige un template o crea una rutina personalizada</p>
              </div>
              <button onClick={() => { setModalAsignar(false); setFechaFinAsignar(null) }} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {cargandoTemplates ? (
                <div className="flex items-center justify-center py-10"><Loader2 size={22} className="animate-spin" style={{ color: "var(--blue)" }} /></div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell size={32} className="mx-auto mb-3" style={{ color: "var(--foreground-subtle)" }} />
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Sin templates disponibles</p>
                  <p className="text-xs mb-4" style={{ color: "var(--foreground-muted)" }}>Crea tu primera rutina y guárdala como template.</p>
                </div>
              ) : templates.map((t) => {
                const diasActivos = t.dias.filter((d) => !d.es_descanso)
                const totalEjs    = diasActivos.reduce((s, d) => s + d.ejercicios.length, 0)
                return (
                  <button key={t.id} onClick={() => asignarTemplate(t.id)} disabled={asignando}
                    className="w-full text-left rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
                    style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--background-hover)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--background)" }}
                  >
                    <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{t.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                      {diasActivos.length} días activos · {totalEjs} ejercicios{t.objetivo ? ` · ${t.objetivo}` : ""}
                    </p>
                  </button>
                )
              })}
            </div>
            <div className="px-4 pb-4 pt-3 border-t flex-shrink-0 space-y-3" style={{ borderColor: "var(--border)" }}>
              <VigenciaSelector value={fechaFinAsignar} onChange={setFechaFinAsignar} />
              <Link href={`/coach/rutinas/nueva?alumno_id=${alumno.id}`} onClick={() => setModalAsignar(false)} className="btn-secondary w-full justify-center text-sm">
                <Plus size={14} /> Crear rutina personalizada
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Plan alimenticio ── */}
      {tabActiva === "plan_alimenticio" && (
        <div className="space-y-4">
          {plan ? (
            <>
              {/* Header plan */}
              <div className="rounded-2xl p-5" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--green-bg)" }}>
                      <UtensilsCrossed size={18} style={{ color: "var(--green)" }} />
                    </span>
                    <div>
                      <p className="font-bold" style={{ color: "var(--foreground)" }}>{plan.nombre}</p>
                      {plan.calorias_objetivo && (
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                          Objetivo: {plan.calorias_objetivo} kcal/día
                        </p>
                      )}
                    </div>
                  </div>
                  {!esSoloLectura && (
                    <Link href={`/coach/planes-alimenticios/${plan.id}`} className="btn-ghost text-xs py-1.5 px-3">Editar</Link>
                  )}
                </div>
                {plan.fecha_fin && (() => {
                  const fin     = new Date(plan.fecha_fin + "T12:00:00")
                  const vencida = fin < new Date()
                  return (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-0.5 mt-1"
                      style={{
                        background: vencida ? "var(--red-bg, #FEF2F2)" : "var(--green-bg)",
                        color:      vencida ? "var(--red)" : "var(--green)",
                      }}
                    >
                      <CalendarClock size={11} />
                      {vencida ? "Vigencia vencida" : `Hasta el ${fin.toLocaleDateString("es-EC", { day: "numeric", month: "short" })}`}
                    </span>
                  )
                })()}
              </div>

              {/* Día tabs + comidas */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                <div className="flex overflow-x-auto border-b" style={{ borderColor: "var(--border)" }}>
                  {DIAS_SEMANA.map((d) => {
                    const diaInfo  = plan.dias.find((x) => x.dia_semana === d)
                    const esActivo = d === diaPlanVista
                    const esHoy    = d === hoy
                    const numCom   = diaInfo?.comidas.length ?? 0
                    return (
                      <button key={d} type="button" onClick={() => setDiaPlanVista(d)}
                        className="flex-shrink-0 flex flex-col items-center px-3 py-3 text-xs font-bold transition-colors"
                        style={{
                          color:        esActivo ? "var(--green)" : "var(--foreground-muted)",
                          borderBottom: esActivo ? "2px solid var(--green)" : "2px solid transparent",
                          background:   esActivo ? "var(--green-bg)" : "transparent",
                        }}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full mb-0.5 font-extrabold"
                          style={{
                            background: esHoy && esActivo ? "var(--green)" : "transparent",
                            color:      esHoy && esActivo ? "white" : esActivo ? "var(--green)" : "var(--foreground-muted)",
                          }}
                        >{DIA_CORTO[d]}</span>
                        {diaInfo?.es_libre ? (
                          <span style={{ color: "var(--foreground-subtle)", fontSize: "9px" }}>LIBRE</span>
                        ) : diaInfo ? (
                          <span style={{ fontSize: "9px" }}>{numCom} com.</span>
                        ) : (
                          <span style={{ color: "var(--foreground-subtle)", fontSize: "9px" }}>—</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {(() => {
                  const diaInfo = plan.dias.find((d) => d.dia_semana === diaPlanVista)
                  if (!diaInfo) return (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No hay datos para {DIA_NOMBRE[diaPlanVista]}.</p>
                    </div>
                  )
                  if (diaInfo.es_libre) return (
                    <div className="flex flex-col items-center justify-center py-10 px-5">
                      <UtensilsCrossed size={28} className="mb-2" style={{ color: "var(--orange)" }} />
                      <p className="text-sm font-bold mb-1" style={{ color: "var(--orange)" }}>{DIA_NOMBRE[diaPlanVista]} — Día libre</p>
                      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Sin restricciones nutricionales este día.</p>
                    </div>
                  )

                  const comidasOrd = [...diaInfo.comidas].sort(
                    (a, b) => MOMENTOS_ORDEN.indexOf(a.momento) - MOMENTOS_ORDEN.indexOf(b.momento)
                  )
                  const totCal    = comidasOrd.reduce((s, c) => s + (c.calorias    ?? 0), 0)
                  const totProt   = comidasOrd.reduce((s, c) => s + (c.proteinas_g ?? 0), 0)
                  const totCarbs  = comidasOrd.reduce((s, c) => s + (c.carbohidratos_g ?? 0), 0)
                  const totGrasas = comidasOrd.reduce((s, c) => s + (c.grasas_g    ?? 0), 0)

                  return (
                    <div>
                      {diaInfo.nombre_foco && (
                        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-subtle)" }}>{DIA_NOMBRE[diaPlanVista]}</p>
                          <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{diaInfo.nombre_foco}</p>
                        </div>
                      )}

                      {/* Macros del día */}
                      {totCal > 0 && (
                        <div className="px-5 py-3 grid grid-cols-4 gap-2 border-b" style={{ borderColor: "var(--border)" }}>
                          {[
                            { label: "kcal", valor: totCal,    color: "var(--orange)", bg: "var(--orange-bg)" },
                            { label: "Prot", valor: `${totProt}g`,   color: "var(--blue)",   bg: "var(--blue-bg)"   },
                            { label: "Carbs",valor: `${totCarbs}g`,  color: "var(--green)",  bg: "var(--green-bg)"  },
                            { label: "Gras", valor: `${totGrasas}g`, color: "var(--purple)", bg: "var(--purple-bg)" },
                          ].map(({ label, valor, color, bg }) => (
                            <div key={label} className="rounded-xl py-1.5 text-center" style={{ background: bg }}>
                              <p className="text-sm font-bold" style={{ color }}>{valor}</p>
                              <p className="text-[10px]" style={{ color }}>{label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {comidasOrd.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Sin comidas para este día.</p>
                        </div>
                      ) : (
                        <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                          {comidasOrd.map((c) => {
                            const color = MOMENTO_COLOR[c.momento] ?? "var(--foreground-muted)"
                            return (
                              <li key={c.id} className="px-5 py-4" style={{ borderLeft: "3px solid " + color }}>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: color + "22", color }}>
                                    {MOMENTOS_LABEL[c.momento] ?? c.momento}
                                  </span>
                                  {c.hora_sugerida && (
                                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                      {c.hora_sugerida}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm mb-1.5" style={{ color: "var(--foreground)" }}>{c.descripcion}</p>
                                {(c.calorias || c.proteinas_g || c.carbohidratos_g || c.grasas_g) && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {c.calorias        && <Badge variant="warning">{c.calorias} kcal</Badge>}
                                    {c.proteinas_g     && <Badge variant="blue">{c.proteinas_g}g Prot</Badge>}
                                    {c.carbohidratos_g && <Badge variant="success">{c.carbohidratos_g}g Carbs</Badge>}
                                    {c.grasas_g        && <Badge variant="purple">{c.grasas_g}g Grasas</Badge>}
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })()}
              </div>
            </>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
              <div className="relative mb-4 flex items-center justify-center">
                <div className="absolute h-20 w-20 rounded-full" style={{ background: "rgba(34,197,94,0.10)" }} />
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--green-bg)" }}>
                  <UtensilsCrossed size={26} style={{ color: "var(--green)" }} />
                </span>
              </div>
              <p className="font-bold mb-1" style={{ color: "var(--foreground)" }}>Sin plan alimenticio</p>
              <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
                La nutrición es el 70% del resultado. ¡Crea el plan de este alumno!
              </p>
              {!esSoloLectura && (
                <div className="flex gap-2 justify-center">
                  <button onClick={abrirModalAsignarPlan} className="btn-primary text-sm"><BookOpen size={14} /> Asignar template</button>
                  <Link href="/coach/planes-alimenticios/nuevo" className="btn-secondary text-sm"><Plus size={14} /> Nuevo plan</Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal asignar plan */}
      {modalAsignarPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-md rounded-2xl flex flex-col max-h-[85vh]" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Asignar plan nutricional</h2>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Elige un template para asignar</p>
              </div>
              <button onClick={() => { setModalAsignarPlan(false); setFechaFinAsignarPlan(null) }} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {cargandoTemplatesPlanes ? (
                <div className="flex items-center justify-center py-10"><Loader2 size={22} className="animate-spin" style={{ color: "var(--green)" }} /></div>
              ) : templatesPlanes.length === 0 ? (
                <div className="text-center py-8">
                  <UtensilsCrossed size={32} className="mx-auto mb-3" style={{ color: "var(--foreground-subtle)" }} />
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Sin templates disponibles</p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Crea un plan y guárdalo como template primero.</p>
                </div>
              ) : templatesPlanes.map((t) => {
                const diasConComidas = t.dias.filter((d) => !d.es_libre && d.comidas.length > 0)
                const totalComidas   = diasConComidas.reduce((s, d) => s + d.comidas.length, 0)
                return (
                  <button key={t.id} onClick={() => asignarTemplatePlan(t.id)} disabled={asignandoPlan}
                    className="w-full text-left rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
                    style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--background-hover)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--background)" }}
                  >
                    <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{t.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                      {diasConComidas.length} días · {totalComidas} comidas{t.objetivo ? ` · ${t.objetivo}` : ""}
                    </p>
                  </button>
                )
              })}
            </div>
            <div className="px-4 pb-4 pt-3 border-t flex-shrink-0 space-y-3" style={{ borderColor: "var(--border)" }}>
              <VigenciaSelector value={fechaFinAsignarPlan} onChange={setFechaFinAsignarPlan} />
              <Link href="/coach/planes-alimenticios/nuevo" onClick={() => setModalAsignarPlan(false)} className="btn-secondary w-full justify-center text-sm">
                <Plus size={14} /> Crear plan personalizado
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Adherencia ── */}
      {tabActiva === "adherencia" && (
        <AdherenciaPanel alumnoId={alumno.id} />
      )}

      {/* ── Progreso ── */}
      {tabActiva === "progreso" && (
        <div className="rounded-2xl p-6 text-center" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          {tieneGraficas ? (
            <>
              <BarChart2 size={32} className="mx-auto mb-3" style={{ color: "var(--blue)" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Gráficas de progreso</p>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Las gráficas se implementan en la <strong style={{ color: "var(--blue)" }}>Fase 8</strong>.
              </p>
            </>
          ) : (
            <>
              <Lock size={32} className="mx-auto mb-3" style={{ color: "var(--orange)" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Gráficas de progreso</p>
              <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>Disponible en el Plan Inicial.</p>
              <Link href="/coach/mi-plan" className="btn-primary text-sm">Ver Plan Inicial</Link>
            </>
          )}
        </div>
      )}

      {/* Modal archivar */}
      {modalArchivar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-7 animate-scale-in" style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>¿Archivar a {alumno.nombre}?</h2>
            <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
              El alumno pasará a estado archivado. Sus datos se conservan y puedes recuperarlo en cualquier momento.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalArchivar(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={archivarAlumno} disabled={archivando}
                className="btn-primary flex-1 justify-center disabled:opacity-60"
                style={{ background: "var(--red)", boxShadow: "none" }}
              >
                {archivando ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Archivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
