import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { UtensilsCrossed } from "lucide-react"
import { EmptyState } from "@/components/ui"
import { PlanAlimenticioView } from "./PlanAlimenticioView"
import { ExportarPDFBtn } from "@/components/domain/ExportarPDFBtn"

export default async function MiPlanAlimenticioPage() {
  const session = await auth()
  if (!session?.user.alumnoId) redirect("/login")

  const alumno = await prisma.alumno.findUnique({
    where: { id: session.user.alumnoId },
    include: {
      planes_alimenticios: {
        where: { activo: true, deleted_at: null },
        include: { comidas: { orderBy: { momento: "asc" } } },
        take: 1,
      },
    },
  })

  const plan = alumno?.planes_alimenticios[0] ?? null

  if (!plan) {
    return (
      <div className="animate-fade-in">
        <h1 className="section-title mb-2">Mi plan alimenticio</h1>
        <EmptyState
          icono={UtensilsCrossed}
          titulo="Sin plan alimenticio"
          subtitulo="Tu coach aún no te ha asignado un plan nutricional."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Mi plan alimenticio</h1>
          <p className="section-subtitle">Tu guía nutricional del día</p>
        </div>
        <ExportarPDFBtn href={`/api/exportar/plan/${plan.id}`} label="Exportar PDF" />
      </div>
      <PlanAlimenticioView
        plan={{
          nombre: plan.nombre,
          calorias_objetivo: plan.calorias_objetivo,
          comidas: plan.comidas.map((c) => ({
            id: c.id,
            momento: c.momento,
            hora_sugerida: c.hora_sugerida,
            descripcion: c.descripcion,
            calorias: c.calorias,
            proteinas_g: c.proteinas_g,
            carbohidratos_g: c.carbohidratos_g,
            grasas_g: c.grasas_g,
          })),
        }}
      />
    </div>
  )
}
