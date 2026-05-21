import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Avatar, Badge } from "@/components/ui"
import { AlumnoDetailTabs } from "@/components/domain/AlumnoDetailTabs"
import { GraficaProgreso } from "@/components/domain/GraficaProgreso"
import { formatFechaCorta } from "@/lib/utils"
import { PlanFeatureService } from "@/lib/plan-features"
import type { Objetivo } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia:   "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza:        "Fuerza",
  resistencia:   "Resistencia",
  general:       "General",
}

export default async function AlumnoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const alumno = await prisma.alumno.findFirst({
    where: { id, coach_id: session.user.coachId, deleted_at: null },
    include: {
      user: { select: { nombre: true, apellido: true, email: true, telefono: true } },
      mediciones: { orderBy: { fecha: "desc" } },
      rutinas: {
        where: { activa: true, deleted_at: null },
        include: {
          dias: {
            orderBy: { orden: "asc" },
            include: { ejercicios: { orderBy: { orden: "asc" } } },
          },
        },
        orderBy: { created_at: "desc" },
      },
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
    },
  })

  if (!alumno) notFound()

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId },
    select: { plan_actual: true, estado_plan: true },
  })

  const tieneGraficas = PlanFeatureService.tieneFeature(coach?.plan_actual ?? "gratis", "graficas_progreso")

  // Semanas activo
  const ahora = new Date()
  const semanas = alumno.fecha_inicio
    ? Math.floor((ahora.getTime() - new Date(alumno.fecha_inicio).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : null

  const ultimaMedicion = alumno.mediciones[0]

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/coach/alumnos"
        className="flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "var(--foreground-muted)" }}
      >
        <ChevronLeft size={16} />
        Mis alumnos
      </Link>

      {/* Header del alumno */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--background-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar nombre={alumno.user.nombre} apellido={alumno.user.apellido} size="lg" />

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1
                className="text-2xl font-extrabold"
                style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
              >
                {alumno.user.nombre} {alumno.user.apellido}
              </h1>
              <Badge variant={alumno.activo ? "success" : "neutral"} dot>
                {alumno.activo ? "Activo" : "Archivado"}
              </Badge>
              {alumno.objetivo && (
                <Badge variant="blue">
                  {OBJETIVO_LABEL[alumno.objetivo]}
                </Badge>
              )}
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
              {alumno.user.email}
              {alumno.user.telefono && ` · ${alumno.user.telefono}`}
            </p>

            {/* Métricas rápidas */}
            <div className="flex flex-wrap gap-5">
              {semanas !== null && (
                <div>
                  <p className="text-xl font-extrabold" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
                    {semanas}
                  </p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Semanas activo</p>
                </div>
              )}
              {ultimaMedicion?.peso_kg && (
                <div>
                  <p className="text-xl font-extrabold" style={{ color: "var(--blue)", letterSpacing: "-0.02em" }}>
                    {Number(ultimaMedicion.peso_kg).toFixed(1)} kg
                  </p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Último peso</p>
                </div>
              )}
              {ultimaMedicion?.cintura_cm && (
                <div>
                  <p className="text-xl font-extrabold" style={{ color: "var(--green)", letterSpacing: "-0.02em" }}>
                    {Number(ultimaMedicion.cintura_cm).toFixed(1)} cm
                  </p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Cintura</p>
                </div>
              )}
              {ultimaMedicion?.porcentaje_grasa && (
                <div>
                  <p className="text-xl font-extrabold" style={{ color: "var(--orange)", letterSpacing: "-0.02em" }}>
                    {Number(ultimaMedicion.porcentaje_grasa).toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>% Grasa</p>
                </div>
              )}
              {ultimaMedicion && (
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                    {formatFechaCorta(ultimaMedicion.fecha)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--foreground-subtle)" }}>Última medición</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AlumnoDetailTabs
        alumno={{
          id: alumno.id,
          nombre: alumno.user.nombre,
          apellido: alumno.user.apellido,
          email: alumno.user.email,
          telefono: alumno.user.telefono ?? "",
          identificacion: alumno.identificacion ?? "",
          fecha_nacimiento: alumno.fecha_nacimiento?.toISOString().split("T")[0] ?? "",
          genero: alumno.genero ?? "",
          altura_cm: alumno.altura_cm?.toString() ?? "",
          peso_inicial_kg: alumno.peso_inicial_kg?.toString() ?? "",
          objetivo: alumno.objetivo ?? "",
          fecha_inicio: alumno.fecha_inicio?.toISOString().split("T")[0] ?? "",
          notas_medicas: alumno.notas_medicas ?? "",
          activo: alumno.activo,
        }}
        mediciones={alumno.mediciones}
        rutinas={alumno.rutinas.map((r) => ({
          id:               r.id,
          nombre:           r.nombre,
          descripcion:      r.descripcion,
          duracion_minutos: r.duracion_minutos,
          objetivo:         r.objetivo,
          dias: r.dias.map((d) => ({
            id: d.id, dia_semana: d.dia_semana, nombre_foco: d.nombre_foco,
            es_descanso: d.es_descanso, orden: d.orden,
            ejercicios: d.ejercicios.map((e) => ({
              id: e.id, orden: e.orden, nombre: e.nombre,
              series: e.series, repeticiones: e.repeticiones,
              peso_kg: e.peso_kg ? e.peso_kg.toString() : null,
              descanso_segundos: e.descanso_segundos,
              rpe: e.rpe, progresion: e.progresion, notas: e.notas,
            })),
          })),
          fecha_fin: r.fecha_fin?.toISOString().split("T")[0] ?? null,
        }))}
        alumnoObjetivo={alumno.objetivo ?? undefined}
        plan={alumno.planes_alimenticios[0]
          ? {
              id:                alumno.planes_alimenticios[0].id,
              nombre:            alumno.planes_alimenticios[0].nombre,
              calorias_objetivo: alumno.planes_alimenticios[0].calorias_objetivo,
              fecha_fin:         alumno.planes_alimenticios[0].fecha_fin?.toISOString().slice(0, 10) ?? null,
              dias: alumno.planes_alimenticios[0].dias.map((d) => ({
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
            }
          : null}
        coachPlan={coach?.plan_actual ?? "gratis"}
        esSoloLectura={coach?.estado_plan === "solo_lectura"}
      />

      {/* Gráficas de progreso */}
      <GraficaProgreso alumnoId={alumno.id} tieneGraficas={tieneGraficas} />
    </div>
  )
}
