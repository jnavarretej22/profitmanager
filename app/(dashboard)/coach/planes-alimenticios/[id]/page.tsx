import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { PlanAlimenticioForm } from "@/components/domain/PlanAlimenticioForm"
import { ExportarPDFBtn } from "@/components/domain/ExportarPDFBtn"

export default async function EditarPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const plan = await prisma.planAlimenticio.findFirst({
    where: { id, coach_id: session.user.coachId, deleted_at: null },
    include: { comidas: { orderBy: { momento: "asc" } } },
  })
  if (!plan) notFound()

  const alumnos = await prisma.alumno.findMany({
    where: { coach_id: session.user.coachId, activo: true, deleted_at: null },
    include: { user: { select: { nombre: true, apellido: true } } },
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/coach/planes-alimenticios" className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: "var(--foreground-muted)" }}>
          <ChevronLeft size={16} />
          Volver a planes alimenticios
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">{plan.nombre}</h1>
            <p className="section-subtitle">Edita el plan nutricional</p>
          </div>
          <ExportarPDFBtn href={`/api/exportar/plan/${id}`} label="Exportar PDF" />
        </div>
      </div>
      <PlanAlimenticioForm
        planId={id}
        valorInicial={{
          nombre: plan.nombre,
          objetivo: plan.objetivo ?? "",
          calorias_objetivo: plan.calorias_objetivo ?? undefined,
          es_template: plan.es_template,
          alumno_id: plan.alumno_id,
          comidas: plan.comidas.map((c) => ({
            momento: c.momento as never,
            hora_sugerida: c.hora_sugerida
              ? new Date(c.hora_sugerida).toTimeString().slice(0, 5)
              : "",
            descripcion: c.descripcion,
            calorias: c.calorias?.toString() ?? "",
            proteinas_g: c.proteinas_g?.toString() ?? "",
            carbohidratos_g: c.carbohidratos_g?.toString() ?? "",
            grasas_g: c.grasas_g?.toString() ?? "",
          })),
        }}
        alumnos={alumnos.map((a) => ({ id: a.id, nombre: a.user.nombre, apellido: a.user.apellido }))}
      />
    </div>
  )
}
