import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

// Página de redirección post-login: lee el rol en servidor y redirige
export default async function AuthRedirectPage() {
  const session = await auth()

  if (!session) redirect("/login")

  const rol = session.user.role
  if (rol === "coach") redirect("/coach")
  if (rol === "alumno") redirect("/alumno")
  if (rol === "admin") redirect("/admin")

  redirect("/")
}
