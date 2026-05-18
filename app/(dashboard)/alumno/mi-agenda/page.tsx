import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { Calendar, Clock, Video, MapPin } from "lucide-react"
import { Badge, EmptyState } from "@/components/ui"

export default async function MiAgendaPage() {
  const session = await auth()
  if (!session?.user.alumnoId) redirect("/login")

  const citas = await prisma.cita.findMany({
    where: { alumno_id: session.user.alumnoId, estado: { not: "cancelada" } },
    orderBy: { fecha_inicio: "asc" },
  })

  const ahora = new Date()
  const proximas = citas.filter((c) => new Date(c.fecha_inicio) >= ahora && c.estado === "agendada")
  const pasadas  = citas.filter((c) => new Date(c.fecha_inicio) < ahora || c.estado !== "agendada")

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="section-title">Mi agenda</h1>
        <p className="section-subtitle">Tus reuniones con el coach</p>
      </div>

      {citas.length === 0 ? (
        <EmptyState
          icono={Calendar}
          titulo="Sin citas programadas"
          subtitulo="Tu coach agendará reuniones contigo desde su panel."
        />
      ) : (
        <>
          {/* Próximas */}
          {proximas.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--foreground-subtle)" }}>
                Próximas
              </h2>
              <div className="space-y-3">
                {proximas.map((c) => <CitaCard key={c.id} cita={c} />)}
              </div>
            </section>
          )}

          {/* Pasadas */}
          {pasadas.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3 mt-4" style={{ color: "var(--foreground-subtle)" }}>
                Pasadas
              </h2>
              <div className="space-y-3">
                {pasadas.map((c) => <CitaCard key={c.id} cita={c} pasada />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function CitaCard({ cita, pasada = false }: { cita: {
  id: string; titulo: string; fecha_inicio: Date; fecha_fin: Date
  modalidad: string; estado: string; meet_link: string | null
  ubicacion: string | null; notas: string | null
}, pasada?: boolean }) {
  const fecha = new Date(cita.fecha_inicio)
  const horaInicio = fecha.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
  const horaFin = new Date(cita.fecha_fin).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
  const diaLabel = fecha.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div
      className="rounded-2xl p-5 transition-all"
      style={{
        background: "var(--background-card)",
        border: `1px solid ${pasada ? "var(--border)" : "var(--blue)33"}`,
        boxShadow: pasada ? "none" : "var(--shadow-sm)",
        opacity: pasada ? 0.75 : 1,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Mini calendario */}
        <div
          className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl flex-shrink-0"
          style={{ background: pasada ? "var(--background)" : "var(--purple-bg)" }}
        >
          <span
            className="text-xl font-extrabold leading-none"
            style={{ color: pasada ? "var(--foreground-muted)" : "var(--purple)" }}
          >
            {fecha.getDate()}
          </span>
          <span
            className="text-xs"
            style={{ color: pasada ? "var(--foreground-subtle)" : "var(--purple)" }}
          >
            {fecha.toLocaleDateString("es-EC", { month: "short" })}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{cita.titulo}</h3>
            <Badge variant={cita.estado === "agendada" ? "blue" : cita.estado === "completada" ? "success" : "neutral"} dot>
              {cita.estado === "agendada" ? "Agendada" : cita.estado === "completada" ? "Completada" : "Cancelada"}
            </Badge>
            <Badge variant={cita.modalidad === "online" ? "blue" : "warning"}>
              {cita.modalidad === "online" ? "Online" : "Presencial"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {horaInicio} – {horaFin}
            </span>
            {cita.ubicacion && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {cita.ubicacion}
              </span>
            )}
          </div>

          {cita.notas && (
            <p className="text-xs mt-1.5 italic" style={{ color: "var(--foreground-subtle)" }}>{cita.notas}</p>
          )}
        </div>
      </div>

      {cita.meet_link && cita.estado === "agendada" && (
        <a
          href={cita.meet_link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4 w-full justify-center text-sm"
          style={{ display: "flex" }}
        >
          <Video size={15} />
          Unirme a la reunión
        </a>
      )}
    </div>
  )
}
