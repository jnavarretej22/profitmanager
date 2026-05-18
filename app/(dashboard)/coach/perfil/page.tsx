import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { CoachPerfilForm } from "./CoachPerfilForm"
import { GoogleCalendarSection } from "./GoogleCalendarSection"

export default async function CoachPerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>
}) {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const sp = await searchParams

  const [user, coach] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nombre: true, apellido: true, email: true, telefono: true, zona_horaria: true, pais: true },
    }),
    prisma.coach.findUnique({
      where: { id: session.user.coachId },
      select: {
        id: true, plan_actual: true, bio: true, especialidad: true,
        logo_url: true, google_calendar_token: true,
      },
    }),
  ])

  if (!user || !coach) redirect("/login")

  const googleStatus = sp.google === "ok" ? "ok" : sp.google === "error" ? "error" : null

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="section-title">Mi perfil</h1>
        <p className="section-subtitle">Información personal y configuración de tu cuenta</p>
      </div>

      <CoachPerfilForm
        nombre={user.nombre}
        apellido={user.apellido}
        email={user.email}
        telefono={user.telefono ?? ""}
        zona_horaria={user.zona_horaria ?? "America/Guayaquil"}
        pais={user.pais ?? "EC"}
        bio={coach.bio ?? ""}
        especialidad={coach.especialidad ?? ""}
      />

      {/* Google Calendar (solo plan Inicial) */}
      {coach.plan_actual === "inicial" && (
        <GoogleCalendarSection
          conectado={!!coach.google_calendar_token}
          googleStatus={googleStatus}
        />
      )}
    </div>
  )
}
