import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, UtensilsCrossed, ChevronRight, Users } from "lucide-react"
import { Badge, EmptyState } from "@/components/ui"
import { PlanFeatureService } from "@/lib/plan-features"
import type { Objetivo } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: "Hipertrofia", perdida_grasa: "Pérdida de grasa",
  fuerza: "Fuerza", resistencia: "Resistencia", general: "General",
}

export default async function PlanesAlimenticiosPage({
  searchParams,
}: {
  searchParams: Promise<{ objetivo?: string; tipo?: string }>
}) {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const { objetivo, tipo } = await searchParams
  const coachId = session.user.coachId

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { plan_actual: true, estado_plan: true },
  })
  if (!coach) redirect("/login")

  const planes = await prisma.planAlimenticio.findMany({
    where: {
      coach_id: coachId,
      deleted_at: null,
      activo: true,
      ...(objetivo ? { objetivo: objetivo as Objetivo } : {}),
      ...(tipo === "template" ? { es_template: true } : tipo === "asignada" ? { es_template: false, alumno_id: { not: null } } : {}),
    },
    include: {
      comidas: { select: { calorias: true, proteinas_g: true, carbohidratos_g: true, grasas_g: true } },
      alumno: { include: { user: { select: { nombre: true, apellido: true } } } },
    },
    orderBy: { updated_at: "desc" },
  })

  const tieneTemplatesDietas = PlanFeatureService.tieneFeature(coach.plan_actual, "templates_dietas_objetivo")
  const esSoloLectura = coach.estado_plan === "solo_lectura"

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">Planes alimenticios</h1>
          <p className="section-subtitle">Crea y asigna planes nutricionales a tus alumnos</p>
        </div>
        {!esSoloLectura && (
          <Link href="/coach/planes-alimenticios/nuevo" className="btn-primary">
            <Plus size={16} /> Nuevo plan
          </Link>
        )}
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-2">
        {[{ label: "Todos", tipo: "" }, { label: "Asignados", tipo: "asignada" }, { label: "Templates", tipo: "template" }].map((f) => (
          <button
            key={f.tipo}
            type="submit"
            name="tipo"
            value={f.tipo}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: (tipo ?? "") === f.tipo ? "var(--green)" : "var(--background-card)",
              color:      (tipo ?? "") === f.tipo ? "white" : "var(--foreground-muted)",
              border:     `1px solid ${(tipo ?? "") === f.tipo ? "var(--green)" : "var(--border)"}`,
            }}
          >
            {f.label}
          </button>
        ))}
        <select name="objetivo" defaultValue={objetivo ?? ""} className="input-base py-1.5 text-xs ml-auto">
          <option value="">Todos los objetivos</option>
          <option value="hipertrofia">Hipertrofia</option>
          <option value="perdida_grasa">Pérdida de grasa</option>
          <option value="fuerza">Fuerza</option>
          <option value="resistencia">Resistencia</option>
          <option value="general">General</option>
        </select>
        <button type="submit" className="btn-secondary text-xs py-1.5">Filtrar</button>
      </form>

      {planes.length === 0 ? (
        <EmptyState
          icono={UtensilsCrossed}
          titulo="Sin planes alimenticios"
          subtitulo="Crea tu primer plan nutricional para tus alumnos."
          cta={!esSoloLectura ? { label: "Nuevo plan", href: "/coach/planes-alimenticios/nuevo" } : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {planes.map((p) => {
            const totalCal = p.comidas.reduce((s, c) => s + (c.calorias ?? 0), 0)
            const totalProt = p.comidas.reduce((s, c) => s + (c.proteinas_g ?? 0), 0)
            const totalCarbs = p.comidas.reduce((s, c) => s + (c.carbohidratos_g ?? 0), 0)
            const totalGrasas = p.comidas.reduce((s, c) => s + (c.grasas_g ?? 0), 0)

            return (
              <Link
                key={p.id}
                href={`/coach/planes-alimenticios/${p.id}`}
                className="flex flex-col rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--green-bg)" }}>
                    <UtensilsCrossed size={18} style={{ color: "var(--green)" }} />
                  </span>
                  <div className="flex gap-1">
                    {p.es_template && <Badge variant="purple">Template</Badge>}
                    {p.objetivo && <Badge variant="success">{OBJETIVO_LABEL[p.objetivo]}</Badge>}
                  </div>
                </div>

                <h3 className="text-sm font-bold mb-1 line-clamp-1" style={{ color: "var(--foreground)" }}>{p.nombre}</h3>

                {p.alumno && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users size={12} style={{ color: "var(--foreground-subtle)" }} />
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {p.alumno.user.nombre} {p.alumno.user.apellido}
                    </span>
                  </div>
                )}

                {/* Macros resumen */}
                {totalCal > 0 && (
                  <div className="grid grid-cols-4 gap-1 mt-2 mb-3">
                    {[
                      { label: "kcal", valor: totalCal, color: "var(--orange)" },
                      { label: "Prot", valor: `${totalProt}g`, color: "var(--blue)" },
                      { label: "Carbs", valor: `${totalCarbs}g`, color: "var(--green)" },
                      { label: "Grasas", valor: `${totalGrasas}g`, color: "var(--purple)" },
                    ].map(({ label, valor, color }) => (
                      <div key={label} className="text-center rounded-lg py-1.5" style={{ background: "var(--background)" }}>
                        <p className="text-xs font-bold" style={{ color }}>{valor}</p>
                        <p className="text-[10px]" style={{ color: "var(--foreground-subtle)" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                    {p.comidas.length} comida{p.comidas.length !== 1 ? "s" : ""}
                  </span>
                  <ChevronRight size={14} style={{ color: "var(--foreground-subtle)" }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
