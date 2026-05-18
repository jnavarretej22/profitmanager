import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { SolicitudesClient } from "./SolicitudesClient"

export const metadata = { title: "Solicitudes de inscripción" }

export default async function SolicitudesPage() {
  const session = await auth()
  if (!session || session.user.role !== "coach") redirect("/login")

  const solicitudes = await prisma.solicitudInscripcion.findMany({
    where:   { coach_id: session.user.coachId ?? "" },
    orderBy: { created_at: "desc" },
    select: {
      id:           true,
      nombre:       true,
      email:        true,
      telefono:     true,
      mensaje:      true,
      estado:       true,
      nota_interna: true,
      alumno_id:    true,
      created_at:   true,
    },
  })

  // Cupos disponibles del coach
  const coach = await prisma.coach.findUnique({
    where:  { id: session.user.coachId ?? "" },
    select: {
      plan_actual: true,
      _count: { select: { alumnos: { where: { activo: true, deleted_at: null } } } },
    },
  })

  const limitePlan = { gratis: 3, inicial: 10, medio: 30, medio_plus: 80, ilimitado: 999999 }
  const limite     = limitePlan[coach?.plan_actual ?? "gratis"]
  const cuposUsados = coach?._count.alumnos ?? 0
  const cuposDisponibles = Math.max(0, limite - cuposUsados)

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="section-title">Solicitudes de inscripción</h1>
        <p className="section-subtitle">
          Alumnos potenciales que solicitan unirse a tu equipo desde tu perfil público
        </p>
      </div>

      {/* Stat cupos */}
      <div
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{
          background:  cuposDisponibles === 0 ? "var(--orange-bg)" : "var(--blue-bg)",
          border:      `1px solid ${cuposDisponibles === 0 ? "#fed7aa" : "#bfdbfe"}`,
        }}
      >
        <span className="text-2xl">{cuposDisponibles === 0 ? "⚠️" : "✅"}</span>
        <div>
          <p className="text-sm font-bold" style={{ color: cuposDisponibles === 0 ? "var(--orange)" : "var(--blue)" }}>
            {cuposDisponibles === 0
              ? "No tienes cupos disponibles"
              : `${cuposDisponibles} cupo${cuposDisponibles !== 1 ? "s" : ""} disponible${cuposDisponibles !== 1 ? "s" : ""}`
            }
          </p>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            {cuposUsados} de {limite} alumnos en tu plan
            {cuposDisponibles === 0 && " — No podrás aprobar nuevas solicitudes hasta liberar cupos o cambiar tu plan"}
          </p>
        </div>
      </div>

      <SolicitudesClient solicitudes={solicitudes} cuposDisponibles={cuposDisponibles} />
    </div>
  )
}
