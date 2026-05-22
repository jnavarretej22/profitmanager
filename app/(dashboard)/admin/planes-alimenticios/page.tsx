import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, UtensilsCrossed, ChevronRight, ChevronLeft } from "lucide-react"
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

export default async function AdminPlanesAlimenticiosPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const templates = await prisma.planAlimenticio.findMany({
    where: {
      es_template:         true,
      es_template_sistema: true,
      deleted_at:          null,
      activo:              true,
    },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { comidas: { select: { id: true } } },
      },
    },
    orderBy: { updated_at: "desc" },
  })

  return (
    <div className="space-y-6 animate-fade-in">
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
          <h1 className="section-title">Templates de planes alimenticios</h1>
          <p className="section-subtitle">Plantillas globales que los coaches pueden clonar para sus alumnos</p>
        </div>
        <Link href="/admin/planes-alimenticios/nuevo" className="btn-primary">
          <Plus size={16} /> Nuevo template
        </Link>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icono={UtensilsCrossed}
          titulo="Sin templates"
          subtitulo="Crea el primer template para que los coaches lo puedan reutilizar al armar planes."
          cta={{ href: "/admin/planes-alimenticios/nuevo", label: "Crear template" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const diasConComidas = t.dias.filter((d) => !d.es_libre)
            const totalComidas   = diasConComidas.reduce((s, d) => s + d.comidas.length, 0)
            const planReq        = t.plan_requerido as PlanActual | null
            return (
              <Link
                key={t.id}
                href={`/admin/planes-alimenticios/${t.id}`}
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

                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
                  <span>{diasConComidas.length} días</span>
                  <span>·</span>
                  <span>{totalComidas} comidas</span>
                  {t.calorias_objetivo && (
                    <>
                      <span>·</span>
                      <span>{t.calorias_objetivo} kcal</span>
                    </>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
