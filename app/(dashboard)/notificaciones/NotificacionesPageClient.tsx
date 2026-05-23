"use client"

import { useState } from "react"
import { Bell, CheckCheck, Calendar, Dumbbell, UtensilsCrossed, CreditCard, Clock, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  link: string | null
  leida: boolean
  created_at: string
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora mismo"
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  if (dias < 7) return `hace ${dias} día${dias !== 1 ? "s" : ""}`
  return new Date(fecha).toLocaleDateString("es-EC", { day: "numeric", month: "short" })
}

function IconoTipo({ tipo }: { tipo: string }) {
  const size = 16
  if (tipo.includes("cita"))      return <Calendar size={size} />
  if (tipo.includes("rutina"))    return <Dumbbell size={size} />
  if (tipo.includes("plan") || tipo.includes("dieta")) return <UtensilsCrossed size={size} />
  if (tipo.includes("pago") || tipo.includes("vencimiento")) return <CreditCard size={size} />
  if (tipo.includes("medicion"))  return <Clock size={size} />
  return <AlertCircle size={size} />
}

function colorTipo(tipo: string): string {
  if (tipo.includes("vencimiento")) return "var(--red)"
  if (tipo.includes("pago"))        return "var(--green)"
  if (tipo.includes("cita"))        return "var(--blue)"
  if (tipo.includes("rutina"))      return "var(--purple)"
  return "var(--orange)"
}

function MarcarTodasBtn() {
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  async function marcarTodas() {
    setCargando(true)
    await fetch("/api/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    router.refresh()
    setCargando(false)
  }

  return (
    <button
      onClick={marcarTodas}
      disabled={cargando}
      className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {cargando ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
      Marcar todas
    </button>
  )
}

interface GrupoProps {
  titulo: string
  lista: Notificacion[]
  onMarcar: (id: string, link: string | null) => void
}

function GrupoNotificaciones({ titulo, lista, onMarcar }: GrupoProps) {
  if (lista.length === 0) return null
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold px-1 mb-2" style={{ color: "var(--foreground-muted)" }}>
        {titulo}
      </p>
      <div
        className="rounded-2xl overflow-hidden divide-y"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)", borderColor: "var(--border)" }}
      >
        {lista.map((n) => (
          <div
            key={n.id}
            onClick={() => onMarcar(n.id, n.link)}
            className="flex gap-4 px-5 py-4 transition-colors cursor-pointer"
            style={{ background: n.leida ? "transparent" : "var(--blue-bg)" }}
          >
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: `${colorTipo(n.tipo)}18`, color: colorTipo(n.tipo) }}
            >
              <IconoTipo tipo={n.tipo} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {n.titulo}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: "var(--foreground-subtle)" }}>
                    {tiempoRelativo(n.created_at)}
                  </span>
                  {!n.leida && (
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--blue)" }} />
                  )}
                </div>
              </div>
              <p className="text-sm mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                {n.mensaje}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificacionesPageClientInner({ notificaciones: inicial }: { notificaciones: Notificacion[] }) {
  const [notificaciones, setNotificaciones] = useState(inicial)
  const router = useRouter()

  async function marcarUna(id: string, link: string | null) {
    await fetch(`/api/notificaciones/${id}/leer`, { method: "PATCH" })
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
    if (link) router.push(link)
  }

  const sinLeer = notificaciones.filter((n) => !n.leida)
  const leidas  = notificaciones.filter((n) => n.leida)

  if (notificaciones.length === 0) {
    return (
      <div
        className="rounded-2xl py-16 text-center"
        style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
      >
        <Bell size={36} className="mx-auto mb-3" style={{ color: "var(--foreground-subtle)" }} />
        <p className="font-semibold" style={{ color: "var(--foreground)" }}>Sin notificaciones</p>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Cuando haya actividad en tu cuenta aparecerá aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GrupoNotificaciones titulo="Sin leer" lista={sinLeer} onMarcar={marcarUna} />
      <GrupoNotificaciones titulo="Anteriores" lista={leidas} onMarcar={marcarUna} />
    </div>
  )
}

export const NotificacionesPageClient = Object.assign(NotificacionesPageClientInner, {
  MarcarTodasBtn,
})
