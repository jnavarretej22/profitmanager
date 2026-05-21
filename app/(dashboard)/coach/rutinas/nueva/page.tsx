import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { RutinaForm } from "@/components/domain/RutinaForm"

export const metadata = { title: "Nueva rutina" }

export default async function NuevaRutinaPage({
  searchParams,
}: {
  searchParams: Promise<{ alumno_id?: string }>
}) {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const { alumno_id: alumnoIdParam } = await searchParams

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.coachId },
    select: { estado_plan: true },
  })
  if (coach?.estado_plan === "solo_lectura") redirect("/coach/rutinas")

  const alumnos = await prisma.alumno.findMany({
    where: { coach_id: session.user.coachId, activo: true, deleted_at: null },
    include: { user: { select: { nombre: true, apellido: true } } },
    orderBy: { created_at: "desc" },
  })

  // Pre-selecciona el alumno solo si pertenece al coach y está activo
  const alumnoPreseleccionado = alumnoIdParam && alumnos.some((a) => a.id === alumnoIdParam)
    ? alumnoIdParam
    : null

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/coach/rutinas" className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: "var(--foreground-muted)" }}>
          <ChevronLeft size={16} />
          Volver a rutinas
        </Link>
        <h1 className="section-title">Nueva rutina</h1>
        <p className="section-subtitle">Crea una rutina y asígnala a un alumno</p>
      </div>
      <RutinaForm
        valorInicial={alumnoPreseleccionado ? { alumno_id: alumnoPreseleccionado } : undefined}
        alumnos={alumnos.map((a) => ({
          id: a.id, nombre: a.user.nombre, apellido: a.user.apellido,
        }))}
      />
    </div>
  )
}
