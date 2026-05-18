import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

// Redirección según rol al path correcto con layout de dashboard
export default async function NotificacionesRedirectPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const rol = session.user.role
  if (rol === "coach")  redirect("/coach/notificaciones")
  if (rol === "admin")  redirect("/admin/notificaciones")
  if (rol === "alumno") redirect("/alumno/notificaciones")

  redirect("/login")
}
