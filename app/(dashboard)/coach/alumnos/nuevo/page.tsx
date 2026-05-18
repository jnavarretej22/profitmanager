import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { PlanFeatureService } from "@/lib/plan-features"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { AlumnoForm } from "@/components/domain/AlumnoForm"

export const metadata = { title: "Nuevo alumno" }

export default async function NuevoAlumnoPage() {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId },
    select: { plan_actual: true, estado_plan: true },
  })
  if (!coach) redirect("/login")

  const totalActivos = await prisma.alumno.count({
    where: { coach_id: session.user.coachId, activo: true },
  })
  const limite = PlanFeatureService.limiteAlumnos(coach.plan_actual)

  // Si no puede agregar, redirigir al listado con mensaje
  if (coach.estado_plan === "solo_lectura" || totalActivos >= limite) {
    redirect("/coach/alumnos")
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <Link
          href="/coach/alumnos"
          className="flex items-center gap-1.5 text-sm font-medium mb-4"
          style={{ color: "var(--foreground-muted)" }}
        >
          <ChevronLeft size={16} />
          Volver a alumnos
        </Link>
        <h1 className="section-title">Nuevo alumno</h1>
        <p className="section-subtitle">
          Completará su contraseña cuando inicie sesión por primera vez
        </p>
      </div>

      <AlumnoForm />
    </div>
  )
}
