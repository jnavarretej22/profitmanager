"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2, Dumbbell, UtensilsCrossed, BarChart2, Lock, Clock, RotateCcw } from "lucide-react"
import { AlumnoForm } from "./AlumnoForm"
import { MedicionForm, HistorialMediciones } from "./MedicionForm"
import { Badge } from "@/components/ui"
import type { Medicion } from "@prisma/client"

type Tab = "perfil" | "mediciones" | "rutina" | "plan_alimenticio" | "progreso"

const TABS: { id: Tab; label: string }[] = [
  { id: "perfil", label: "Perfil" },
  { id: "mediciones", label: "Mediciones" },
  { id: "rutina", label: "Rutina" },
  { id: "plan_alimenticio", label: "Plan alimenticio" },
  { id: "progreso", label: "Progreso" },
]

const DIAS_LABEL: Record<string, string> = {
  lunes: "Lun", martes: "Mar", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom",
}

const MOMENTOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno", media_manana: "Media mañana",
  almuerzo: "Almuerzo", merienda: "Merienda", cena: "Cena",
}

type EjercicioData = {
  id: string; orden: number; nombre: string; series: number | null;
  repeticiones: string | null; descanso_segundos?: number | null;
  rpe?: string | null; notas?: string | null
}

type ComidaData = {
  id: string; momento: string; hora_sugerida?: Date | null;
  descripcion: string; calorias?: number | null;
  proteinas_g?: number | null; carbohidratos_g?: number | null; grasas_g?: number | null
}

interface AlumnoDetailTabsProps {
  alumno: {
    id: string
    nombre: string
    apellido: string
    email: string
    telefono: string
    identificacion: string
    fecha_nacimiento: string
    genero: string
    altura_cm: string
    peso_inicial_kg: string
    objetivo: string
    fecha_inicio: string
    notas_medicas: string
    activo: boolean
  }
  mediciones: Medicion[]
  rutina: {
    id: string; nombre: string; descripcion?: string | null;
    dias_semana: unknown; duracion_minutos?: number | null;
    ejercicios: EjercicioData[]
  } | null
  plan: {
    id: string; nombre: string; calorias_objetivo?: number | null;
    comidas: ComidaData[]
  } | null
  coachPlan: string
  esSoloLectura: boolean
}

export function AlumnoDetailTabs({
  alumno, mediciones: medicionesIniciales, rutina, plan, coachPlan, esSoloLectura,
}: AlumnoDetailTabsProps) {
  const router = useRouter()
  const [tabActiva, setTabActiva] = useState<Tab>("perfil")
  const [mediciones, setMediciones] = useState<Medicion[]>(medicionesIniciales)
  const [archivando, setArchivando] = useState(false)
  const [modalArchivar, setModalArchivar] = useState(false)

  const tieneGraficas = coachPlan === "inicial"

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
      <div
        className="flex overflow-x-auto border-b mb-5"
        style={{ borderColor: "var(--border)" }}
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTabActiva(id)}
            className="px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors"
            style={{
              borderColor: tabActiva === id ? "var(--blue)" : "transparent",
              color: tabActiva === id ? "var(--blue)" : "var(--foreground-muted)",
            }}
          >
            {label}
            {id === "progreso" && !tieneGraficas && (
              <Lock size={12} className="inline ml-1.5" style={{ color: "var(--orange)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Contenido de cada tab */}

      {tabActiva === "perfil" && (
        <div className="space-y-5">
          {!esSoloLectura ? (
            <AlumnoForm
              alumnoId={alumno.id}
              valorInicial={alumno}
              onExito={() => router.refresh()}
            />
          ) : (
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--background-card)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Tu plan está en modo solo lectura. No puedes editar datos.
              </p>
            </div>
          )}

          {/* Archivar alumno */}
          {alumno.activo && !esSoloLectura && (
            <div
              className="rounded-2xl px-5 py-4 flex items-center justify-between"
              style={{ background: "var(--red-bg)", border: "1px solid var(--red)22" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--red)" }}>
                  Zona de peligro
                </p>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  Archivar no elimina datos, solo oculta al alumno de la lista activa.
                </p>
              </div>
              <button
                onClick={() => setModalArchivar(true)}
                className="btn-secondary text-sm py-2"
                style={{ color: "var(--red)", borderColor: "var(--red)44" }}
              >
                <Trash2 size={14} />
                Archivar
              </button>
            </div>
          )}
        </div>
      )}

      {tabActiva === "mediciones" && (
        <div className="space-y-5">
          {!esSoloLectura && (
            <MedicionForm
              alumnoId={alumno.id}
              onNuevaMedicion={(m) => setMediciones((prev) => [m, ...prev])}
            />
          )}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--background-card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Historial de mediciones
              </h3>
            </div>
            <div className="px-5 py-3">
              <HistorialMediciones mediciones={mediciones} />
            </div>
          </div>
        </div>
      )}

      {tabActiva === "rutina" && (
        <div className="space-y-4">
          {rutina ? (
            <>
              {/* Header de rutina */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--blue-bg)" }}>
                      <Dumbbell size={18} style={{ color: "var(--blue)" }} />
                    </span>
                    <div>
                      <p className="font-bold" style={{ color: "var(--foreground)" }}>{rutina.nombre}</p>
                      {rutina.descripcion && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{rutina.descripcion}</p>
                      )}
                    </div>
                  </div>
                  {!esSoloLectura && (
                    <Link href={`/coach/rutinas/${rutina.id}`} className="btn-ghost text-xs py-1.5 px-3">
                      Editar
                    </Link>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(rutina.dias_semana as string[] ?? []).map((d) => (
                    <span key={d} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--blue)", color: "white" }}>
                      {DIAS_LABEL[d] ?? d}
                    </span>
                  ))}
                  {rutina.duracion_minutos && (
                    <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--background)", color: "var(--foreground-muted)" }}>
                      <Clock size={11} /> {rutina.duracion_minutos} min
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de ejercicios */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    {rutina.ejercicios.length} Ejercicio{rutina.ejercicios.length !== 1 ? "s" : ""}
                  </h3>
                </div>
                <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {rutina.ejercicios.map((ej) => (
                    <li key={ej.id} className="flex items-start gap-3 px-5 py-4">
                      <span
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                        style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
                      >
                        {ej.orden}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{ej.nombre}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                          {ej.series ?? "—"} series × {ej.repeticiones ?? "—"} reps
                          {ej.descanso_segundos ? ` · ${ej.descanso_segundos}s descanso` : ""}
                          {ej.rpe ? ` · RPE ${ej.rpe}` : ""}
                        </p>
                        {ej.notas && <p className="text-xs mt-0.5 italic" style={{ color: "var(--foreground-subtle)" }}>{ej.notas}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
            >
              <Dumbbell size={32} className="mx-auto mb-3" style={{ color: "var(--foreground-subtle)" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Sin rutina asignada</p>
              <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
                Crea una rutina y asígnala a este alumno.
              </p>
              {!esSoloLectura && (
                <Link href="/coach/rutinas/nueva" className="btn-primary text-sm">
                  <Dumbbell size={14} /> Nueva rutina
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {tabActiva === "plan_alimenticio" && (
        <div className="space-y-4">
          {plan ? (
            <>
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center justify-between mb-3">
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
                    <Link href={`/coach/planes-alimenticios/${plan.id}`} className="btn-ghost text-xs py-1.5 px-3">
                      Editar
                    </Link>
                  )}
                </div>

                {/* Macros totales */}
                {plan.comidas.some((c) => c.calorias) && (() => {
                  const totCal = plan.comidas.reduce((s, c) => s + (c.calorias ?? 0), 0)
                  const totProt = plan.comidas.reduce((s, c) => s + (c.proteinas_g ?? 0), 0)
                  const totCarbs = plan.comidas.reduce((s, c) => s + (c.carbohidratos_g ?? 0), 0)
                  const totGrasas = plan.comidas.reduce((s, c) => s + (c.grasas_g ?? 0), 0)
                  return (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "kcal", valor: totCal, color: "var(--orange)", bg: "var(--orange-bg)" },
                        { label: "Prot", valor: `${totProt}g`, color: "var(--blue)", bg: "var(--blue-bg)" },
                        { label: "Carbs", valor: `${totCarbs}g`, color: "var(--green)", bg: "var(--green-bg)" },
                        { label: "Grasas", valor: `${totGrasas}g`, color: "var(--purple)", bg: "var(--purple-bg)" },
                      ].map(({ label, valor, color, bg }) => (
                        <div key={label} className="rounded-xl py-2 text-center" style={{ background: bg }}>
                          <p className="text-sm font-bold" style={{ color }}>{valor}</p>
                          <p className="text-[10px]" style={{ color }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Comidas por momento */}
              {["desayuno","media_manana","almuerzo","merienda","cena"].map((momento) => {
                const comidasMomento = plan.comidas.filter((c) => c.momento === momento)
                if (comidasMomento.length === 0) return null
                return (
                  <div
                    key={momento}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
                  >
                    <div className="px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
                      <h4 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                        {MOMENTOS_LABEL[momento]}
                      </h4>
                    </div>
                    <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {comidasMomento.map((c) => (
                        <li key={c.id} className="px-5 py-3">
                          {c.hora_sugerida && (
                            <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>
                              {new Date(c.hora_sugerida).toTimeString().slice(0, 5)}
                            </p>
                          )}
                          <p className="text-sm" style={{ color: "var(--foreground)" }}>{c.descripcion}</p>
                          {(c.proteinas_g || c.carbohidratos_g || c.grasas_g) && (
                            <div className="flex gap-2 mt-1.5 flex-wrap">
                              {c.calorias && <Badge variant="warning">{c.calorias} kcal</Badge>}
                              {c.proteinas_g && <Badge variant="blue">{c.proteinas_g}g Prot</Badge>}
                              {c.carbohidratos_g && <Badge variant="success">{c.carbohidratos_g}g Carbs</Badge>}
                              {c.grasas_g && <Badge variant="purple">{c.grasas_g}g Grasas</Badge>}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </>
          ) : (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
            >
              <UtensilsCrossed size={32} className="mx-auto mb-3" style={{ color: "var(--foreground-subtle)" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Sin plan alimenticio</p>
              <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
                Crea un plan nutricional para este alumno.
              </p>
              {!esSoloLectura && (
                <Link href="/coach/planes-alimenticios/nuevo" className="btn-primary text-sm">
                  <UtensilsCrossed size={14} /> Nuevo plan
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {tabActiva === "progreso" && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: "var(--background-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
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
              <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
                Disponible en el Plan Inicial.
              </p>
              <Link href="/coach/mi-plan" className="btn-primary text-sm">
                Ver Plan Inicial
              </Link>
            </>
          )}
        </div>
      )}

      {/* Modal archivar */}
      {modalArchivar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-7 animate-scale-in"
            style={{
              background: "var(--background-card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>
              ¿Archivar a {alumno.nombre}?
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
              El alumno pasará a estado archivado. Sus datos se conservan y puedes recuperarlo en cualquier momento.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalArchivar(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={archivarAlumno}
                disabled={archivando}
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
