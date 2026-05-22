import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { RutinaForm } from "@/components/domain/RutinaForm"
import { EliminarTemplateBtn } from "./EliminarTemplateBtn"

export const metadata = { title: "Editar template de rutina" }

export default async function EditarTemplateRutinaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const { id } = await params

  const rutina = await prisma.rutina.findFirst({
    where: { id, es_template: true, es_template_sistema: true, deleted_at: null },
    include: {
      dias: {
        orderBy: { orden: "asc" },
        include: { ejercicios: { orderBy: { orden: "asc" } } },
      },
    },
  })

  if (!rutina) notFound()

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/rutinas"
            className="flex items-center gap-1.5 text-sm font-medium mb-4"
            style={{ color: "var(--foreground-muted)" }}
          >
            <ChevronLeft size={16} />
            Volver a templates
          </Link>
          <h1 className="section-title">Editar template</h1>
          <p className="section-subtitle">{rutina.nombre}</p>
        </div>
        <EliminarTemplateBtn rutinaId={rutina.id} />
      </div>

      <RutinaForm
        rutinaId={rutina.id}
        modoAdmin
        alumnos={[]}
        valorInicial={{
          nombre:           rutina.nombre,
          descripcion:      rutina.descripcion ?? "",
          objetivo:         rutina.objetivo ?? "",
          duracion_minutos: rutina.duracion_minutos ?? undefined,
          plan_requerido:   rutina.plan_requerido ?? "inicial",
          dias: rutina.dias.map((d) => ({
            dia_semana:  d.dia_semana,
            nombre_foco: d.nombre_foco,
            es_descanso: d.es_descanso,
            ejercicios: d.ejercicios.map((e) => ({
              nombre:            e.nombre,
              series:            e.series ?? 3,
              repeticiones:      e.repeticiones ?? "10",
              peso_kg:           e.peso_kg ? e.peso_kg.toString() : null,
              descanso_segundos: e.descanso_segundos ?? undefined,
              rpe:               e.rpe ?? null,
              progresion:        e.progresion ?? null,
              notas:             e.notas ?? null,
            })),
          })),
        }}
      />
    </div>
  )
}
