import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { PlanAlimenticioForm } from "@/components/domain/PlanAlimenticioForm"

export default async function NuevoPlanAlimenticioPage() {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId },
    select: { estado_plan: true },
  })
  if (coach?.estado_plan === "solo_lectura") redirect("/coach/planes-alimenticios")

  const alumnos = await prisma.alumno.findMany({
    where: { coach_id: session.user.coachId, activo: true, deleted_at: null },
    include: { user: { select: { nombre: true, apellido: true } } },
    orderBy: { created_at: "desc" },
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/coach/planes-alimenticios" className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: "var(--foreground-muted)" }}>
          <ChevronLeft size={16} />
          Volver a planes alimenticios
        </Link>
        <h1 className="section-title">Nuevo plan alimenticio</h1>
        <p className="section-subtitle">Diseña el plan nutricional para tu alumno</p>
      </div>
      <PlanAlimenticioForm
        alumnos={alumnos.map((a) => ({ id: a.id, nombre: a.user.nombre, apellido: a.user.apellido }))}
      />
    </div>
  )
}
