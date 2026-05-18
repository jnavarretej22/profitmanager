import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, Plus, Search, ChevronRight, Lock } from "lucide-react"
import { Avatar, Badge, EmptyState } from "@/components/ui"
import { PlanFeatureService } from "@/lib/plan-features"
import { formatFechaCorta } from "@/lib/utils"
import type { Objetivo } from "@prisma/client"

const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia:   "Hipertrofia",
  perdida_grasa: "Pérdida de grasa",
  fuerza:        "Fuerza",
  resistencia:   "Resistencia",
  general:       "General",
}

const OBJETIVO_VARIANT = {
  hipertrofia:   "blue",
  perdida_grasa: "orange",
  fuerza:        "purple",
  resistencia:   "success",
  general:       "neutral",
} as const

export default async function AlumnosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; objetivo?: string; estado?: string }>
}) {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const { q = "", objetivo, estado } = await searchParams
  const coachId = session.user.coachId

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { plan_actual: true, estado_plan: true },
  })
  if (!coach) redirect("/login")

  const alumnos = await prisma.alumno.findMany({
    where: {
      coach_id: coachId,
      deleted_at: null,
      ...(estado === "archivado" ? { activo: false } : estado === "activo" ? { activo: true } : {}),
      ...(objetivo ? { objetivo: objetivo as Objetivo } : {}),
      ...(q
        ? {
            OR: [
              { user: { nombre: { contains: q, mode: "insensitive" } } },
              { user: { apellido: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { nombre: true, apellido: true, email: true } },
      mediciones: { orderBy: { fecha: "desc" }, take: 1, select: { peso_kg: true, fecha: true } },
    },
    orderBy: { created_at: "desc" },
  })

  const totalActivos = await prisma.alumno.count({ where: { coach_id: coachId, activo: true } })
  const limite = PlanFeatureService.limiteAlumnos(coach.plan_actual)
  const puedeAgregar = coach.estado_plan !== "solo_lectura" && totalActivos < limite

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-title">Mis alumnos</h1>
          <p className="section-subtitle">Gestiona y da seguimiento a tu lista</p>
        </div>

        <div className="relative">
          <Link
            href={puedeAgregar ? "/coach/alumnos/nuevo" : "/coach/mi-plan"}
            className={`btn-primary ${!puedeAgregar ? "opacity-60 cursor-not-allowed" : ""}`}
            title={!puedeAgregar ? `Límite de ${limite} alumnos alcanzado` : undefined}
          >
            {!puedeAgregar ? <Lock size={16} /> : <Plus size={16} />}
            Nuevo alumno
          </Link>
        </div>
      </div>

      {/* Banner de uso del plan */}
      {totalActivos >= limite * 0.8 && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{
            background: totalActivos >= limite ? "var(--red-bg)" : "var(--orange-bg)",
            border: `1px solid ${totalActivos >= limite ? "var(--red)" : "var(--orange)"}22`,
          }}
        >
          <p className="text-sm font-medium" style={{ color: totalActivos >= limite ? "var(--red)" : "var(--orange)" }}>
            {totalActivos >= limite
              ? `Límite alcanzado: ${totalActivos}/${limite} alumnos. Actualiza tu plan para agregar más.`
              : `Usando ${totalActivos} de ${limite} alumnos disponibles en tu plan.`}
          </p>
          {totalActivos >= limite && (
            <Link href="/coach/mi-plan" className="btn-primary py-1.5 px-3 text-xs">
              Actualizar
            </Link>
          )}
        </div>
      )}

      {/* Filtros y buscador */}
      <form method="GET" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--foreground-subtle)" }}
          />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre..."
            className="input-base pl-9"
          />
        </div>

        <select name="objetivo" defaultValue={objetivo ?? ""} className="input-base sm:w-48">
          <option value="">Todos los objetivos</option>
          <option value="hipertrofia">Hipertrofia</option>
          <option value="perdida_grasa">Pérdida de grasa</option>
          <option value="fuerza">Fuerza</option>
          <option value="resistencia">Resistencia</option>
          <option value="general">General</option>
        </select>

        <select name="estado" defaultValue={estado ?? ""} className="input-base sm:w-40">
          <option value="">Activos e inactivos</option>
          <option value="activo">Solo activos</option>
          <option value="archivado">Archivados</option>
        </select>

        <button type="submit" className="btn-secondary">
          Filtrar
        </button>
      </form>

      {/* Lista */}
      {alumnos.length === 0 ? (
        <EmptyState
          icono={Users}
          titulo="No se encontraron alumnos"
          subtitulo={q ? `Sin resultados para "${q}"` : "Aún no tienes alumnos registrados."}
          cta={puedeAgregar ? { label: "Agregar primer alumno", href: "/coach/alumnos/nuevo" } : undefined}
        />
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--background-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
              {alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""}
            </span>
          </div>

          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {alumnos.map((a) => {
              const ultimaMedicion = a.mediciones[0]
              return (
                <li key={a.id}>
                  <Link
                    href={`/coach/alumnos/${a.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--background-hover)]"
                  >
                    <Avatar nombre={a.user.nombre} apellido={a.user.apellido} size="md" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                          {a.user.nombre} {a.user.apellido}
                        </p>
                        {!a.activo && (
                          <Badge variant="neutral">Archivado</Badge>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>
                        {a.user.email}
                        {ultimaMedicion?.peso_kg && ` · ${ultimaMedicion.peso_kg} kg`}
                        {ultimaMedicion?.fecha && ` · Últ. medición: ${formatFechaCorta(ultimaMedicion.fecha)}`}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                      {a.objetivo && (
                        <Badge variant={OBJETIVO_VARIANT[a.objetivo]}>
                          {OBJETIVO_LABEL[a.objetivo]}
                        </Badge>
                      )}
                    </div>

                    <ChevronRight size={16} style={{ color: "var(--foreground-subtle)", flexShrink: 0 }} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
