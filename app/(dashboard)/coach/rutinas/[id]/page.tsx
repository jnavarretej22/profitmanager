import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { RutinaForm } from "@/components/domain/RutinaForm"
import { ExportarPDFBtn } from "@/components/domain/ExportarPDFBtn"
import { PlanFeatureService } from "@/lib/plan-features"
import { GuardarComoTemplateBtn } from "./GuardarComoTemplateBtn"

export default async function EditarRutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const rutina = await prisma.rutina.findFirst({
    where: { id, coach_id: session.user.coachId, deleted_at: null },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
    },
  })
  if (!rutina) notFound()

  const coach = await prisma.coach.findUnique({
    where:  { id: session.user.coachId },
    select: { plan_actual: true, estado_plan: true },
  })

  const mostrarBotonTemplate = !rutina.es_template && coach?.estado_plan !== "solo_lectura"
  const tieneFeatureTemplates = PlanFeatureService.tieneFeature(
    coach?.plan_actual ?? "gratis",
    "templates_rutinas",
  )

  const alumnos = await prisma.alumno.findMany({
    where: { coach_id: session.user.coachId, activo: true, deleted_at: null },
    include: { user: { select: { nombre: true, apellido: true } } },
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/coach/rutinas" className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: "var(--foreground-muted)" }}>
          <ChevronLeft size={16} />
          Volver a rutinas
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">{rutina.nombre}</h1>
            <p className="section-subtitle">Edita los datos y ejercicios de esta rutina</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mostrarBotonTemplate && (
              <GuardarComoTemplateBtn
                rutinaId={id}
                nombreSugerido={rutina.nombre}
                tieneFeature={tieneFeatureTemplates}
              />
            )}
            <ExportarPDFBtn href={`/api/exportar/rutina/${id}`} label="Exportar PDF" />
          </div>
        </div>
      </div>
      <RutinaForm
        rutinaId={id}
        valorInicial={{
          nombre:           rutina.nombre,
          descripcion:      rutina.descripcion ?? "",
          objetivo:         rutina.objetivo ?? "",
          duracion_minutos: rutina.duracion_minutos ?? undefined,
          es_template:      rutina.es_template,
          alumno_id:        rutina.alumno_id,
          dias: rutina.dias.map((d) => ({
            dia_semana:  d.dia_semana,
            nombre_foco: d.nombre_foco,
            es_descanso: d.es_descanso,
            ejercicios:  d.ejercicios.map((e) => ({
              nombre:            e.nombre,
              series:            e.series ?? 3,
              repeticiones:      e.repeticiones ?? "10",
              peso_kg:           e.peso_kg ? e.peso_kg.toString() : "",
              descanso_segundos: e.descanso_segundos ?? 60,
              rpe:               e.rpe ?? "",
              progresion:        e.progresion ?? "",
              notas:             e.notas ?? "",
            })),
          })),
        }}
        alumnos={alumnos.map((a) => ({
          id: a.id, nombre: a.user.nombre, apellido: a.user.apellido,
        }))}
      />
    </div>
  )
}
