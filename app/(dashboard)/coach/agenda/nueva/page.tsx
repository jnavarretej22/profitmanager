import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { CitaForm } from "@/components/domain/CitaForm"

export default async function NuevaCitaPage() {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId },
    select: { id: true, google_calendar_token: true },
  })
  if (!coach) redirect("/login")

  const alumnos = await prisma.alumno.findMany({
    where: { coach_id: session.user.coachId, activo: true, deleted_at: null },
    include: { user: { select: { nombre: true, apellido: true } } },
    orderBy: { user: { nombre: "asc" } },
  })

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Nueva cita</h1>
        <p className="section-subtitle">Agenda una reunión con tu alumno</p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <CitaForm
          googleConectado={!!coach.google_calendar_token}
          alumnos={alumnos.map((a) => ({ id: a.id, user: { nombre: a.user.nombre, apellido: a.user.apellido } }))}
        />
      </div>
    </div>
  )
}
