"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, XCircle, Clock, UserCheck, Mail,
  Phone, MessageSquare, Loader2, ExternalLink, Copy, Check,
} from "lucide-react"
import { toast } from "sonner"

type EstadoSolicitud = "pendiente" | "aprobada" | "rechazada"

interface Solicitud {
  id:           string
  nombre:       string
  email:        string
  telefono:     string | null
  mensaje:      string | null
  estado:       EstadoSolicitud
  nota_interna: string | null
  alumno_id:    string | null
  created_at:   Date | string
}

interface Props {
  solicitudes:      Solicitud[]
  cuposDisponibles: number
}

const TABS: { id: EstadoSolicitud | "todas"; label: string }[] = [
  { id: "todas",    label: "Todas" },
  { id: "pendiente",label: "Pendientes" },
  { id: "aprobada", label: "Aprobadas" },
  { id: "rechazada",label: "Rechazadas" },
]

interface ModalAccion {
  solicitud: Solicitud
  accion:    "aprobar" | "rechazar"
}

export function SolicitudesClient({ solicitudes, cuposDisponibles }: Props) {
  const [tab, setTab]           = useState<EstadoSolicitud | "todas">("pendiente")
  const [modal, setModal]       = useState<ModalAccion | null>(null)
  const [nota, setNota]         = useState("")
  const [notificar, setNotificar] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [credencial, setCredencial] = useState<{ email: string; password: string } | null>(null)
  const [alumnoIdCreado, setAlumnoIdCreado] = useState<string | null>(null)
  const [copiado, setCopiado]   = useState(false)
  const router = useRouter()

  const filtradas = tab === "todas" ? solicitudes : solicitudes.filter((s) => s.estado === tab)

  const pendientes  = solicitudes.filter((s) => s.estado === "pendiente").length
  const aprobadas   = solicitudes.filter((s) => s.estado === "aprobada").length
  const rechazadas  = solicitudes.filter((s) => s.estado === "rechazada").length

  function abrirModal(solicitud: Solicitud, accion: "aprobar" | "rechazar") {
    setModal({ solicitud, accion })
    setNota("")
    setNotificar(true)
    setCredencial(null)
    setAlumnoIdCreado(null)
  }

  async function ejecutarAccion() {
    if (!modal) return
    setCargando(true)
    try {
      const res = await fetch(`/api/coach/solicitudes/${modal.solicitud.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          accion:       modal.accion,
          nota_interna: nota || undefined,
          notificar:    modal.accion === "rechazar" ? notificar : undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.mensaje ?? `Error al ${modal.accion === "aprobar" ? "aprobar" : "rechazar"}`)
        return
      }

      if (modal.accion === "aprobar" && data.credenciales) {
        setCredencial(data.credenciales)
        setAlumnoIdCreado(data.alumno_id ?? null)
        toast.success(`¡${modal.solicitud.nombre} fue registrado como alumno!`)
      } else {
        toast.success(modal.accion === "aprobar" ? "Solicitud aprobada" : "Solicitud rechazada")
        setModal(null)
      }
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  async function copiarCredencial() {
    if (!credencial) return
    await navigator.clipboard.writeText(`Email: ${credencial.email}\nContraseña: ${credencial.password}`)
    setCopiado(true)
    toast.success("Credenciales copiadas")
    setTimeout(() => setCopiado(false), 2500)
  }

  function cerrarModal() {
    setModal(null)
    setCredencial(null)
    setAlumnoIdCreado(null)
  }

  return (
    <>
      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--gray-100)" }}>
        {TABS.map((t) => {
          const count = t.id === "todas" ? solicitudes.length : t.id === "pendiente" ? pendientes : t.id === "aprobada" ? aprobadas : rechazadas
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t.id ? "white" : "transparent",
                color:      tab === t.id ? "var(--foreground)" : "var(--foreground-muted)",
                boxShadow:  tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t.label}
              {count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: t.id === "pendiente" && tab !== "pendiente" ? "var(--orange)" : "var(--gray-200)",
                    color:      t.id === "pendiente" && tab !== "pendiente" ? "white" : "var(--foreground-muted)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Lista de solicitudes ───────────────────────────── */}
      {filtradas.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>No hay solicitudes</p>
          <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
            {tab === "pendiente" ? "Cuando alguien solicite inscribirse desde tu perfil público, aparecerá aquí." : "No hay solicitudes en esta categoría."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((sol) => (
            <SolicitudCard
              key={sol.id}
              solicitud={sol}
              cuposDisponibles={cuposDisponibles}
              onAprobar={() => abrirModal(sol, "aprobar")}
              onRechazar={() => abrirModal(sol, "rechazar")}
            />
          ))}
        </div>
      )}

      {/* ── Modal de confirmación ──────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !credencial) cerrarModal() }}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ background: "var(--background-card)" }}
          >
            <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="font-extrabold text-base" style={{ color: "var(--foreground)" }}>
                {credencial
                  ? "✅ Alumno creado exitosamente"
                  : modal.accion === "aprobar"
                  ? `¿Aprobar a ${modal.solicitud.nombre}?`
                  : `¿Rechazar a ${modal.solicitud.nombre}?`
                }
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Credenciales creadas */}
              {credencial ? (
                <>
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                    El alumno fue registrado. Comparte estas credenciales temporales con él para que pueda acceder a su dashboard.
                  </p>
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: "var(--green-bg)", border: "1px solid #bbf7d0" }}
                  >
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#16a34a" }}>Email</p>
                      <p className="text-sm font-mono font-bold" style={{ color: "var(--foreground)" }}>{credencial.email}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#16a34a" }}>Contraseña temporal</p>
                      <p className="text-lg font-mono font-extrabold tracking-widest" style={{ color: "var(--foreground)" }}>{credencial.password}</p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    📧 También le enviamos un email al alumno con estas credenciales. Recomiéndale que cambie su contraseña al ingresar.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={copiarCredencial} className="btn-secondary flex-1 justify-center gap-2">
                      {copiado ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar credenciales</>}
                    </button>
                    <a
                      href={`/coach/alumnos/${alumnoIdCreado}`}
                      className="btn-primary flex-1 justify-center gap-2"
                    >
                      <ExternalLink size={14} /> Ver perfil del alumno
                    </a>
                  </div>
                  <button onClick={cerrarModal} className="w-full text-center text-xs py-2" style={{ color: "var(--foreground-muted)" }}>
                    Cerrar
                  </button>
                </>
              ) : modal.accion === "aprobar" ? (
                <>
                  {cuposDisponibles === 0 && (
                    <div
                      className="rounded-xl p-3"
                      style={{ background: "var(--orange-bg)", border: "1px solid #fed7aa" }}
                    >
                      <p className="text-sm font-bold" style={{ color: "var(--orange)" }}>
                        ⚠️ No tienes cupos disponibles
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                        No puedes aprobar esta solicitud. Libera un cupo archivando un alumno o actualiza tu plan.
                      </p>
                    </div>
                  )}
                  {cuposDisponibles > 0 && (
                    <>
                      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                        Se creará una cuenta de alumno automáticamente para <strong>{modal.solicitud.nombre}</strong> ({modal.solicitud.email}).
                        Recibirá un email con sus credenciales de acceso.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                          Nota interna (opcional, solo visible para ti)
                        </label>
                        <textarea
                          value={nota}
                          onChange={(e) => setNota(e.target.value.slice(0, 500))}
                          placeholder="Ej: Alumno referido por Juan, objetivo pérdida de grasa..."
                          rows={3}
                          className="input-base resize-none text-sm"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex gap-2">
                    <button onClick={cerrarModal} className="btn-secondary flex-1 justify-center">Cancelar</button>
                    <button
                      onClick={ejecutarAccion}
                      disabled={cargando || cuposDisponibles === 0}
                      className="btn-primary flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: "#22c55e" }}
                    >
                      {cargando ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                      {cargando ? "Aprobando..." : "Aprobar y crear cuenta"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                    La solicitud de <strong>{modal.solicitud.nombre}</strong> será marcada como rechazada.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      Nota interna (opcional)
                    </label>
                    <textarea
                      value={nota}
                      onChange={(e) => setNota(e.target.value.slice(0, 500))}
                      placeholder="Motivo del rechazo..."
                      rows={2}
                      className="input-base resize-none text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificar}
                      onChange={(e) => setNotificar(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                      Notificar al solicitante por email
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={cerrarModal} className="btn-secondary flex-1 justify-center">Cancelar</button>
                    <button
                      onClick={ejecutarAccion}
                      disabled={cargando}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                      style={{ background: "#ef4444", color: "white" }}
                    >
                      {cargando ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      {cargando ? "Rechazando..." : "Rechazar"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Card de solicitud individual ──────────────────────────────────────────────

function SolicitudCard({
  solicitud, cuposDisponibles, onAprobar, onRechazar,
}: {
  solicitud:        Solicitud
  cuposDisponibles: number
  onAprobar:        () => void
  onRechazar:       () => void
}) {
  const fecha = new Date(solicitud.created_at).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  })

  const badgeConfig = {
    pendiente:  { bg: "var(--orange-bg)",  color: "var(--orange)", icono: Clock,         texto: "Pendiente" },
    aprobada:   { bg: "var(--green-bg)",   color: "var(--green)",  icono: CheckCircle2,  texto: "Aprobada" },
    rechazada:  { bg: "var(--gray-100)",   color: "var(--gray-500)", icono: XCircle,     texto: "Rechazada" },
  }
  const badge = badgeConfig[solicitud.estado]
  const BadgeIcon = badge.icono

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-extrabold"
            style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
          >
            {solicitud.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{solicitud.nombre}</p>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{fecha}</p>
          </div>
        </div>
        <span
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
          style={{ background: badge.bg, color: badge.color }}
        >
          <BadgeIcon size={11} />
          {badge.texto}
        </span>
      </div>

      {/* Datos de contacto */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Mail size={12} style={{ color: "var(--foreground-muted)" }} />
          <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{solicitud.email}</span>
        </div>
        {solicitud.telefono && (
          <div className="flex items-center gap-2">
            <Phone size={12} style={{ color: "var(--foreground-muted)" }} />
            <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{solicitud.telefono}</span>
          </div>
        )}
        {solicitud.mensaje && (
          <div className="flex items-start gap-2">
            <MessageSquare size={12} className="mt-0.5 flex-shrink-0" style={{ color: "var(--foreground-muted)" }} />
            <span className="text-xs italic" style={{ color: "var(--foreground-muted)" }}>
              &ldquo;{solicitud.mensaje}&rdquo;
            </span>
          </div>
        )}
      </div>

      {/* Nota interna */}
      {solicitud.nota_interna && (
        <div
          className="rounded-xl p-2.5"
          style={{ background: "var(--gray-50)", border: "1px solid var(--border)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: "var(--foreground-muted)" }}>Nota interna</p>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{solicitud.nota_interna}</p>
        </div>
      )}

      {/* Acciones (solo para pendientes) */}
      {solicitud.estado === "pendiente" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onRechazar}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: "#fee2e2", color: "#ef4444", border: "none" }}
          >
            <XCircle size={13} /> Rechazar
          </button>
          <button
            onClick={onAprobar}
            disabled={cuposDisponibles === 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: cuposDisponibles === 0 ? "var(--gray-200)" : "#dcfce7",
              color:      cuposDisponibles === 0 ? "var(--foreground-muted)" : "#16a34a",
            }}
            title={cuposDisponibles === 0 ? "No tienes cupos disponibles" : undefined}
          >
            <UserCheck size={13} />
            {cuposDisponibles === 0 ? "Sin cupos" : "Aprobar"}
          </button>
        </div>
      )}

      {/* Enlace al perfil del alumno aprobado */}
      {solicitud.estado === "aprobada" && solicitud.alumno_id && (
        <a
          href={`/coach/alumnos/${solicitud.alumno_id}`}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold w-full"
          style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
        >
          <ExternalLink size={12} /> Ver perfil del alumno
        </a>
      )}
    </div>
  )
}
