import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Calendar, CalendarPlus, Clock, Video, MapPin } from "lucide-react"
import { Badge, EmptyState } from "@/components/ui"
import { AgendaFiltros } from "./AgendaFiltros"

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ alumno_id?: string; estado?: string; modalidad?: string }>
}) {
  const session = await auth()
  if (!session?.user.coachId) redirect("/login")

  const sp = await searchParams

  const citas = await prisma.cita.findMany({
    where: {
      coach_id:   session.user.coachId,
      deleted_at: null,
      ...(sp.alumno_id  && { alumno_id: sp.alumno_id }),
      ...(sp.estado     && { estado:    sp.estado    as never }),
      ...(sp.modalidad  && { modalidad: sp.modalidad as never }),
    },
    include: {
      alumno: { include: { user: { select: { nombre: true, apellido: true } } } },
    },
    orderBy: { fecha_inicio: "asc" },
  })

  const alumnos = await prisma.alumno.findMany({
    where: { coach_id: session.user.coachId, activo: true, deleted_at: null },
    include: { user: { select: { nombre: true, apellido: true } } },
    orderBy: { user: { nombre: "asc" } },
  })

  const ahora = new Date()
  const proximas = citas.filter((c) => new Date(c.fecha_inicio) >= ahora && c.estado === "agendada")
  const pasadas  = citas.filter((c) => new Date(c.fecha_inicio) < ahora || c.estado !== "agendada")

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Agenda</h1>
          <p className="section-subtitle">Citas y reuniones con tus alumnos</p>
        </div>
        <Link href="/coach/agenda/nueva" className="btn-primary flex-shrink-0">
          <CalendarPlus size={16} />
          Nueva cita
        </Link>
      </div>

      {/* Filtros */}
      <AgendaFiltros alumnos={alumnos.map((a) => ({ id: a.id, nombre: `${a.user.nombre} ${a.user.apellido}` }))} />

      {citas.length === 0 ? (
        <EmptyState
          icono={Calendar}
          titulo="Sin citas"
          subtitulo="Agenda una reunión con tus alumnos para hacer seguimiento."
          cta={{ label: "Nueva cita", href: "/coach/agenda/nueva" }}
        />
      ) : (
        <>
          {/* Próximas */}
          {proximas.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--foreground-subtle)" }}>
                Próximas ({proximas.length})
              </h2>
              <div className="space-y-3">
                {proximas.map((c) => (
                  <CitaRow key={c.id} cita={c} />
                ))}
              </div>
            </section>
          )}

          {/* Pasadas */}
          {pasadas.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--foreground-subtle)" }}>
                Historial ({pasadas.length})
              </h2>
              <div className="space-y-3 opacity-75">
                {pasadas.map((c) => (
                  <CitaRow key={c.id} cita={c} pasada />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

type CitaConAlumno = {
  id: string; titulo: string; fecha_inicio: Date; fecha_fin: Date
  modalidad: string; estado: string; meet_link: string | null
  ubicacion: string | null; notas: string | null
  alumno: { id: string; user: { nombre: string; apellido: string } }
}

function CitaRow({ cita, pasada = false }: { cita: CitaConAlumno; pasada?: boolean }) {
  const fecha = new Date(cita.fecha_inicio)

  return (
    <div
      className="flex items-start gap-4 rounded-2xl p-5 transition-all"
      style={{
        background: "var(--background-card)",
        border: `1px solid ${pasada ? "var(--border)" : "var(--blue)33"}`,
        boxShadow: pasada ? "none" : "var(--shadow-sm)",
      }}
    >
      {/* Fecha mini */}
      <div
        className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl flex-shrink-0"
        style={{ background: pasada ? "var(--background)" : "var(--purple-bg)" }}
      >
        <span className="text-xl font-extrabold leading-none" style={{ color: pasada ? "var(--foreground-muted)" : "var(--purple)" }}>
          {fecha.getDate()}
        </span>
        <span className="text-xs" style={{ color: pasada ? "var(--foreground-subtle)" : "var(--purple)" }}>
          {fecha.toLocaleDateString("es-EC", { month: "short" })}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 justify-between flex-wrap">
          <div>
            <p className="font-bold mb-0.5" style={{ color: "var(--foreground)" }}>{cita.titulo}</p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>
              {cita.alumno.user.nombre} {cita.alumno.user.apellido}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={cita.estado === "agendada" ? "blue" : cita.estado === "completada" ? "success" : "neutral"} dot>
              {cita.estado === "agendada" ? "Agendada" : cita.estado === "completada" ? "Completada" : "Cancelada"}
            </Badge>
            <Badge variant={cita.modalidad === "online" ? "blue" : "warning"}>
              {cita.modalidad === "online" ? "Online" : "Presencial"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs mt-2" style={{ color: "var(--foreground-muted)" }}>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {fecha.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {new Date(cita.fecha_fin).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {cita.ubicacion && (
            <span className="flex items-center gap-1"><MapPin size={12} /> {cita.ubicacion}</span>
          )}
          {cita.meet_link && (
            <a
              href={cita.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-semibold"
              style={{ color: "var(--blue)" }}
            >
              <Video size={12} /> Ver Meet
            </a>
          )}
        </div>
      </div>

      {/* Acciones */}
      {!pasada && (
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Link href={`/coach/agenda/${cita.id}/editar`} className="btn-secondary text-xs py-1.5 px-3">
            Editar
          </Link>
        </div>
      )}
    </div>
  )
}
