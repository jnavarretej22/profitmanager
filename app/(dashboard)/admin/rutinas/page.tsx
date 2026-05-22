import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Dumbbell, ChevronRight, ChevronLeft } from "lucide-react"
import { Badge, EmptyState } from "@/components/ui"
import type { Objetivo, PlanActual } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia:   "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza:        "Fuerza",
  resistencia:   "Resistencia",
  general:       "General",
}

const OBJETIVO_VARIANT = {
  hipertrofia:   "blue",
  perdida_grasa: "orange",
  fuerza:        "purple",
  resistencia:   "success",
  general:       "neutral",
} as const

const DIAS_CORTO: Record<string, string> = {
  lunes: "L", martes: "M", miercoles: "X", jueves: "J",
  viernes: "V", sabado: "S", domingo: "D",
}

export default async function AdminRutinasPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const templates = await prisma.rutina.findMany({
    where: {
      es_template:         true,
      es_template_sistema: true,
      deleted_at:          null,
      activa:              true,
    },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { select: { id: true } } },
      },
    },
    orderBy: { updated_at: "desc" },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href="/admin"
        className="flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "var(--foreground-muted)" }}
      >
        <ChevronLeft size={16} />
        Panel admin
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">Templates de rutinas</h1>
          <p className="section-subtitle">Plantillas globales que los coaches pueden clonar para sus alumnos</p>
        </div>
        <Link href="/admin/rutinas/nueva" className="btn-primary">
          <Plus size={16} /> Nuevo template
        </Link>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icono={Dumbbell}
          titulo="Sin templates"
          subtitulo="Crea el primer template para que los coaches lo puedan reutilizar al armar rutinas."
          cta={{ href: "/admin/rutinas/nueva", label: "Crear template" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const diasActivos = t.dias.filter((d) => !d.es_descanso)
            const totalEj     = diasActivos.reduce((s, d) => s + d.ejercicios.length, 0)
            const planReq     = t.plan_requerido as PlanActual | null
            return (
              <Link
                key={t.id}
                href={`/admin/rutinas/${t.id}`}
                className="rounded-2xl p-5 transition-all"
                style={{
                  background: "var(--background-card)",
                  border:     "1px solid var(--border)",
                  boxShadow:  "var(--shadow-sm)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-bold leading-tight flex-1" style={{ color: "var(--foreground)" }}>
                    {t.nombre}
                  </h3>
                  <ChevronRight size={16} className="ml-2 flex-shrink-0" style={{ color: "var(--foreground-subtle)" }} />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {t.objetivo && (
                    <Badge variant={OBJETIVO_VARIANT[t.objetivo]}>
                      {OBJETIVO_LABEL[t.objetivo]}
                    </Badge>
                  )}
                  {planReq && (
                    <Badge variant={planReq === "inicial" ? "blue" : "neutral"}>
                      Plan {planReq === "inicial" ? "Inicial" : "Gratis"}
                    </Badge>
                  )}
                </div>

                {t.descripcion && (
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--foreground-muted)" }}>
                    {t.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
                  <span>{diasActivos.length} días</span>
                  <span>·</span>
                  <span>{totalEj} ejercicios</span>
                  {t.duracion_minutos && (
                    <>
                      <span>·</span>
                      <span>{t.duracion_minutos} min</span>
                    </>
                  )}
                </div>

                <div className="flex gap-1 mt-3">
                  {(["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const).map((d) => {
                    const dia = t.dias.find((x) => x.dia_semana === d)
                    const activo = dia && !dia.es_descanso
                    return (
                      <span
                        key={d}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{
                          background: activo ? "var(--blue-bg)" : "var(--background)",
                          color:      activo ? "var(--blue)"    : "var(--foreground-subtle)",
                          border:     activo ? "1px solid var(--blue)" : "1px solid var(--border)",
                        }}
                      >
                        {DIAS_CORTO[d]}
                      </span>
                    )
                  })}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
