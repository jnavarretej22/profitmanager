import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { AppShell } from "@/components/layout"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      notificaciones: {
        orderBy: { created_at: "desc" },
        take: 30,
        select: { id: true, tipo: true, titulo: true, mensaje: true, link: true, leida: true, created_at: true },
      },
    },
  })

  if (!user) redirect("/login")

  return (
    <AppShell
      rol="admin"
      nombre={user.nombre}
      apellido={user.apellido}
      email={user.email}
      notificacionesSinLeer={user.notificaciones.filter((n) => !n.leida).length}
      notificaciones={user.notificaciones.map((n) => ({ ...n, created_at: n.created_at.toISOString() }))}
      zonaHoraria={user.zona_horaria ?? undefined}
    >
      {children}
    </AppShell>
  )
}
