import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Dumbbell, UtensilsCrossed, Plus, Lock } from "lucide-react"
import { Badge } from "@/components/ui"
import type { Objetivo } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: "Hipertrofia", perdida_grasa: "Pérdida de grasa",
  fuerza: "Fuerza", resistencia: "Resistencia", general: "General",
}

export default async function AdminPlanesPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const [rutinasTemplate, planesTemplate] = await Promise.all([
    prisma.rutina.findMany({
      where: { es_template: true, deleted_at: null },
      include: { ejercicios: { select: { id: true } } },
      orderBy: { created_at: "desc" },
    }),
    prisma.planAlimenticio.findMany({
      where: { es_template: true, deleted_at: null },
      include: { comidas: { select: { id: true } } },
      orderBy: { created_at: "desc" },
    }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Templates del sistema</h1>
        <p className="section-subtitle">Rutinas y planes alimenticios disponibles para los coaches</p>
      </div>

      {/* Rutinas template */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Dumbbell size={18} style={{ color: "var(--blue)" }} />
            Rutinas template ({rutinasTemplate.length})
          </h2>
          <Link href="/coach/rutinas/nueva?template=true" className="btn-primary text-sm">
            <Plus size={15} /> Nueva rutina template
          </Link>
        </div>

        {rutinasTemplate.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
            <Dumbbell size={28} className="mx-auto mb-2" style={{ color: "var(--foreground-subtle)" }} />
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No hay rutinas template aún</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rutinasTemplate.map((r) => (
              <Link
                key={r.id}
                href={`/coach/rutinas/${r.id}`}
                className="rounded-2xl p-5 hover:bg-[var(--background-hover)] transition-colors"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--blue-bg)" }}>
                    <Dumbbell size={18} style={{ color: "var(--blue)" }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>{r.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                      {r.ejercicios.length} ejercicios
                    </p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {r.objetivo && <Badge variant="blue">{OBJETIVO_LABEL[r.objetivo]}</Badge>}
                      <Badge variant="neutral">
                        <Lock size={10} className="mr-1" />
                        Solo Plan Inicial
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Planes alimenticios template */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <UtensilsCrossed size={18} style={{ color: "var(--green)" }} />
            Planes alimenticios template ({planesTemplate.length})
          </h2>
          <Link href="/coach/planes-alimenticios/nuevo?template=true" className="btn-primary text-sm">
            <Plus size={15} /> Nuevo plan template
          </Link>
        </div>

        {planesTemplate.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}>
            <UtensilsCrossed size={28} className="mx-auto mb-2" style={{ color: "var(--foreground-subtle)" }} />
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No hay planes template aún</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {planesTemplate.map((p) => (
              <Link
                key={p.id}
                href={`/coach/planes-alimenticios/${p.id}`}
                className="rounded-2xl p-5 hover:bg-[var(--background-hover)] transition-colors"
                style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--green-bg)" }}>
                    <UtensilsCrossed size={18} style={{ color: "var(--green)" }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "var(--foreground)" }}>{p.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                      {p.comidas.length} comidas · {p.calorias_objetivo ?? "—"} kcal
                    </p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {p.objetivo && <Badge variant="success">{OBJETIVO_LABEL[p.objetivo]}</Badge>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
