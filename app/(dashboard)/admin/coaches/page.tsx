import { redirect } from "next/navigation"

// /admin/coaches redirige al dashboard del admin donde está el listado completo de coaches
export default function AdminCoachesPage() {
  redirect("/admin")
}
