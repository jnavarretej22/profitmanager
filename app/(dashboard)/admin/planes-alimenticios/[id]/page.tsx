import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { PlanAlimenticioForm } from "@/components/domain/PlanAlimenticioForm"
import { EliminarPlanBtn } from "./EliminarPlanBtn"

export const metadata = { title: "Editar template de plan alimenticio" }

export default async function EditarTemplatePlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const { id } = await params

  const plan = await prisma.planAlimenticio.findFirst({
    where: { id, es_template: true, es_template_sistema: true, deleted_at: null },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { comidas: { orderBy: { orden: "asc" } } },
      },
    },
  })

  if (!plan) notFound()

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/planes-alimenticios"
            className="flex items-center gap-1.5 text-sm font-medium mb-4"
            style={{ color: "var(--foreground-muted)" }}
          >
            <ChevronLeft size={16} />
            Volver a templates
          </Link>
          <h1 className="section-title">Editar template</h1>
          <p className="section-subtitle">{plan.nombre}</p>
        </div>
        <EliminarPlanBtn planId={plan.id} />
      </div>

      <PlanAlimenticioForm
        planId={plan.id}
        modoAdmin
        alumnos={[]}
        valorInicial={{
          nombre:            plan.nombre,
          objetivo:          plan.objetivo ?? "",
          calorias_objetivo: plan.calorias_objetivo ?? undefined,
          plan_requerido:    plan.plan_requerido ?? "inicial",
          dias: plan.dias.map((d) => ({
            dia_semana:  d.dia_semana,
            nombre_foco: d.nombre_foco,
            es_libre:    d.es_libre,
            comidas: d.comidas.map((c) => ({
              momento:         c.momento,
              hora_sugerida:   c.hora_sugerida
                ? new Date(c.hora_sugerida).toTimeString().slice(0, 5)
                : null,
              descripcion:     c.descripcion,
              calorias:        c.calorias?.toString()        ?? "",
              proteinas_g:     c.proteinas_g?.toString()     ?? "",
              carbohidratos_g: c.carbohidratos_g?.toString() ?? "",
              grasas_g:        c.grasas_g?.toString()        ?? "",
            })),
          })),
        }}
      />
    </div>
  )
}
