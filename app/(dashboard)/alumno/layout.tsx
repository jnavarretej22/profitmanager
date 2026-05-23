import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { AlumnoChrome } from "./AlumnoChrome"
import { AlumnoLogoutForm } from "./AlumnoLogoutForm"

export default async function AlumnoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "alumno") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      nombre: true,
      apellido: true,
      email: true,
      notificaciones: {
        orderBy: { created_at: "desc" },
        take: 30,
        select: { id: true, tipo: true, titulo: true, mensaje: true, link: true, leida: true, created_at: true },
      },
      alumno: {
        select: {
          coach: {
            select: {
              plan_actual: true,
              bio: true,
              especialidad: true,
              user: { select: { nombre: true, apellido: true, email: true, telefono: true } },
            },
          },
        },
      },
    },
  })

  if (!user || !user.alumno) redirect("/login")

  const coach = user.alumno.coach
  const marcaAgua = coach.plan_actual === "gratis"
  const notifSinLeer = user.notificaciones.filter((n) => !n.leida).length
  const notificaciones = user.notificaciones.map((n) => ({ ...n, created_at: n.created_at.toISOString() }))

  const whatsappLink = coach.user.telefono
    ? `https://wa.me/${coach.user.telefono.replace(/\D/g, "")}`
    : null
  const mailtoLink = `mailto:${coach.user.email}`

  return (
    <AlumnoChrome
      user={{ nombre: user.nombre, apellido: user.apellido }}
      coach={{
        nombre:       coach.user.nombre,
        apellido:     coach.user.apellido,
        especialidad: coach.especialidad ?? null,
      }}
      whatsappLink={whatsappLink}
      mailtoLink={mailtoLink}
      notifSinLeer={notifSinLeer}
      notificaciones={notificaciones}
      marcaAgua={marcaAgua}
      logoutForm={<AlumnoLogoutForm />}
    >
      {children}
    </AlumnoChrome>
  )
}
