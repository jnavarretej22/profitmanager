import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { AppShell } from "@/components/layout"
import { PlanProvider } from "@/lib/plan-context"

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "coach") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      coach: true,
      notificaciones: {
        orderBy: { created_at: "desc" },
        take: 30,
        select: { id: true, tipo: true, titulo: true, mensaje: true, link: true, leida: true, created_at: true },
      },
    },
  })

  if (!user || !user.coach) redirect("/login")

  const [totalAlumnos, solicitudesPendientes] = await Promise.all([
    prisma.alumno.count({ where: { coach_id: user.coach.id, activo: true } }),
    prisma.solicitudInscripcion.count({ where: { coach_id: user.coach.id, estado: "pendiente" } }),
  ])

  return (
    <PlanProvider
      plan={user.coach.plan_actual}
      estadoPlan={user.coach.estado_plan}
      totalAlumnos={totalAlumnos}
    >
      <AppShell
        rol="coach"
        nombre={user.nombre}
        apellido={user.apellido}
        email={user.email}
        plan={user.coach.plan_actual}
        estadoPlan={user.coach.estado_plan}
        notificacionesSinLeer={user.notificaciones.filter((n) => !n.leida).length}
        solicitudesPendientes={solicitudesPendientes}
        notificaciones={user.notificaciones.map((n) => ({ ...n, created_at: n.created_at.toISOString() }))}
        zonaHoraria={user.zona_horaria ?? undefined}
      >
        {children}
      </AppShell>
    </PlanProvider>
  )
}
