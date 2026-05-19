import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { Dumbbell, UtensilsCrossed, Info } from "lucide-react"
import { AdminRutinaTemplateCards, AdminPlanTemplateCards } from "./AdminTemplateCards"

export const metadata = { title: "Templates del sistema" }

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
        <p className="section-subtitle">Rutinas y planes alimenticios disponibles para los coaches con Plan Inicial</p>
      </div>

      {/* Aviso informativo */}
      <div
        className="flex items-start gap-3 rounded-2xl px-5 py-4"
        style={{ background: "var(--blue-bg)", border: "1px solid var(--blue)22" }}
      >
        <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--blue)" }} />
        <p className="text-sm" style={{ color: "var(--blue)" }}>
          Los templates son creados por coaches con Plan Inicial. Desde aquí puedes ver y eliminar templates del sistema.
          Para crear nuevos templates, usa una cuenta de coach con Plan Inicial y marca la rutina/plan como template.
        </p>
      </div>

      {/* Rutinas template */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell size={18} style={{ color: "var(--blue)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
            Rutinas template ({rutinasTemplate.length})
          </h2>
        </div>
        <AdminRutinaTemplateCards rutinas={rutinasTemplate} />
      </section>

      {/* Planes alimenticios template */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <UtensilsCrossed size={18} style={{ color: "var(--green)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
            Planes alimenticios template ({planesTemplate.length})
          </h2>
        </div>
        <AdminPlanTemplateCards planes={planesTemplate} />
      </section>
    </div>
  )
}
