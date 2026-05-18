import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { CitaForm } from "@/components/domain/CitaForm"
import { CambiarEstadoCita } from "./CambiarEstadoCita"

export default async function EditarCitaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const { id } = await params

  const [coach, cita, alumnos] = await Promise.all([
    prisma.coach.findUnique({
      where: { id: session.user.coachId },
      select: { id: true, google_calendar_token: true },
    }),
    prisma.cita.findFirst({
      where: { id, coach_id: session.user.coachId },
    }),
    prisma.alumno.findMany({
      where: { coach_id: session.user.coachId, activo: true, deleted_at: null },
      include: { user: { select: { nombre: true, apellido: true } } },
      orderBy: { user: { nombre: "asc" } },
    }),
  ])

  if (!coach || !cita) notFound()

  return (
    <div className="max-w-2xl animate-fade-in space-y-5">
      <div>
        <h1 className="section-title">Editar cita</h1>
        <p className="section-subtitle">Modifica los detalles o el estado de la cita</p>
      </div>

      {/* Cambio rápido de estado */}
      <CambiarEstadoCita citaId={cita.id} estadoActual={cita.estado} />

      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <CitaForm
          googleConectado={!!coach.google_calendar_token}
          alumnos={alumnos.map((a) => ({ id: a.id, user: { nombre: a.user.nombre, apellido: a.user.apellido } }))}
          cita={{
            id: cita.id,
            titulo: cita.titulo,
            alumno_id: cita.alumno_id,
            fecha_inicio: cita.fecha_inicio.toISOString(),
            fecha_fin: cita.fecha_fin.toISOString(),
            modalidad: cita.modalidad,
            ubicacion: cita.ubicacion,
            meet_link: cita.meet_link,
            notas: cita.notas,
          }}
        />
      </div>
    </div>
  )
}
