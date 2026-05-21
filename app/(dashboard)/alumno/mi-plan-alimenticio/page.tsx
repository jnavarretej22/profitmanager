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
        include: {
          dias: {
            orderBy: { orden: "asc" },
            include: { comidas: { orderBy: { orden: "asc" } } },
          },
        },
        take: 1,
      },
      coach: { select: { plan_actual: true } },
    },
  })

  const plan = alumno?.planes_alimenticios[0] ?? null
  const hoyFecha = new Date().toISOString().slice(0, 10)

  // Logs de comidas para hoy (solo si hay plan)
  const logsHoy = plan ? await prisma.comidaLog.findMany({
    where: {
      alumno_id: session.user.alumnoId,
      fecha:     new Date(hoyFecha + "T12:00:00"),
      comida_plan: { dia: { plan_id: plan.id } },
    },
    select: { comida_plan_id: true, cumplida: true },
  }) : []
  const logsPorComida: Record<string, boolean> = {}
  for (const l of logsHoy) logsPorComida[l.comida_plan_id] = l.cumplida

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

  const marcaAgua = alumno?.coach?.plan_actual === "gratis"

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Mi plan alimenticio</h1>
          <p className="section-subtitle">Tu guía nutricional semanal</p>
        </div>
        <ExportarPDFBtn href={`/api/exportar/plan/${plan.id}`} label="Exportar PDF" />
      </div>

      {marcaAgua && (
        <div
          className="rounded-xl px-4 py-2.5 text-center text-xs font-semibold"
          style={{ background: "var(--orange-bg)", color: "var(--orange)", border: "1px solid var(--orange)33" }}
        >
          Powered by ProFit Manager
        </div>
      )}

      <PlanAlimenticioView
        plan={{
          id:                plan.id,
          nombre:            plan.nombre,
          calorias_objetivo: plan.calorias_objetivo,
          fecha_fin:         plan.fecha_fin?.toISOString().slice(0, 10) ?? null,
          dias: plan.dias.map((d) => ({
            id:          d.id,
            dia_semana:  d.dia_semana,
            nombre_foco: d.nombre_foco,
            es_libre:    d.es_libre,
            orden:       d.orden,
            comidas: d.comidas.map((c) => ({
              id:              c.id,
              momento:         c.momento,
              hora_sugerida:   c.hora_sugerida
                ? new Date(c.hora_sugerida).toTimeString().slice(0, 5)
                : null,
              descripcion:     c.descripcion,
              calorias:        c.calorias,
              proteinas_g:     c.proteinas_g,
              carbohidratos_g: c.carbohidratos_g,
              grasas_g:        c.grasas_g,
            })),
          })),
        }}
        hoyFecha={hoyFecha}
        logsHoy={logsPorComida}
      />
    </div>
  )
}
