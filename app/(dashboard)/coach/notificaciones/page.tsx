import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { NotificacionesPageClient } from "../../notificaciones/NotificacionesPageClient"

export const metadata = { title: "Notificaciones" }

export default async function CoachNotificacionesPage() {
  const session = await auth()
  if (!session || session.user.role !== "coach") redirect("/login")

  const notificaciones = await prisma.notificacion.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" },
    take: 100,
  })

  const sinLeer = notificaciones.filter((n) => !n.leida).length

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title">Notificaciones</h1>
          <p className="section-subtitle">
            {sinLeer > 0 ? `${sinLeer} sin leer` : "Todas leídas"}
          </p>
        </div>
        {sinLeer > 0 && <NotificacionesPageClient.MarcarTodasBtn />}
      </div>

      <NotificacionesPageClient
        notificaciones={notificaciones.map((n) => ({
          ...n,
          created_at: n.created_at.toISOString(),
        }))}
      />
    </div>
  )
}
