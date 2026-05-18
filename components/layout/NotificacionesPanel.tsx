"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, X, Check, CheckCheck, AlertCircle, Calendar, Dumbbell, UtensilsCrossed, CreditCard, Clock } from "lucide-react"

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  link: string | null
  leida: boolean
  created_at: string
}

interface Props {
  notificacionesSinLeer: number
  notificaciones: Notificacion[]
  rol?: string  // para construir el link "Ver todas" según el rol
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora mismo"
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  return `hace ${dias} día${dias !== 1 ? "s" : ""}`
}

function IconoTipo({ tipo }: { tipo: string }) {
  const props = { size: 14 }
  if (tipo.includes("cita")) return <Calendar {...props} />
  if (tipo.includes("rutina")) return <Dumbbell {...props} />
  if (tipo.includes("dieta") || tipo.includes("plan")) return <UtensilsCrossed {...props} />
  if (tipo.includes("pago") || tipo.includes("vencimiento")) return <CreditCard {...props} />
  if (tipo.includes("medicion")) return <Clock {...props} />
  return <AlertCircle {...props} />
}

function colorTipo(tipo: string): string {
  if (tipo.includes("vencimiento")) return "var(--red)"
  if (tipo.includes("pago")) return "var(--green)"
  if (tipo.includes("cita")) return "var(--blue)"
  if (tipo.includes("rutina")) return "var(--purple)"
  return "var(--orange)"
}

export function NotificacionesPanel({ notificacionesSinLeer: conteoInicial, notificaciones: notificacionesIniciales, rol }: Props) {
  const verTodasLink = rol === "admin" ? "/admin/notificaciones"
                     : rol === "alumno" ? "/alumno/notificaciones"
                     : "/coach/notificaciones"
  const [abierto, setAbierto] = useState(false)
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales)
  const [sinLeer, setSinLeer] = useState(conteoInicial)
  const [marcando, setMarcando] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    if (abierto) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [abierto])

  async function marcarTodas() {
    setMarcando(true)
    await fetch("/api/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    setSinLeer(0)
    setMarcando(false)
  }

  async function marcarUna(id: string) {
    await fetch(`/api/notificaciones/${id}/leer`, { method: "PATCH" })
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
    setSinLeer((prev) => Math.max(0, prev - 1))
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón campana */}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="relative btn-ghost p-2 rounded-xl"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {sinLeer > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: "var(--red)", color: "white" }}
          >
            {sinLeer > 9 ? "9+" : sinLeer}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {abierto && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50"
          style={{
            background: "var(--background-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                Notificaciones
              </p>
              {sinLeer > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--red)", color: "white" }}
                >
                  {sinLeer}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {sinLeer > 0 && (
                <button
                  onClick={marcarTodas}
                  disabled={marcando}
                  className="btn-ghost p-1.5 rounded-lg text-xs flex items-center gap-1"
                  style={{ color: "var(--foreground-muted)", fontSize: "11px" }}
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={13} />
                  Todas
                </button>
              )}
              <button
                onClick={() => setAbierto(false)}
                className="btn-ghost p-1.5 rounded-lg"
                style={{ color: "var(--foreground-muted)" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="overflow-y-auto" style={{ maxHeight: "380px" }}>
            {notificaciones.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto mb-2" style={{ color: "var(--foreground-subtle)" }} />
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Sin notificaciones</p>
              </div>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.leida) marcarUna(n.id) }}
                  className="flex gap-3 px-4 py-3 transition-colors cursor-pointer border-b"
                  style={{
                    background: n.leida ? "transparent" : "var(--blue-bg)",
                    borderColor: "var(--border)",
                  }}
                >
                  {/* Ícono tipo */}
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: `${colorTipo(n.tipo)}20`, color: colorTipo(n.tipo) }}
                  >
                    <IconoTipo tipo={n.tipo} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-xs font-semibold leading-tight truncate"
                        style={{ color: "var(--foreground)" }}
                      >
                        {n.titulo}
                      </p>
                      {!n.leida && (
                        <div
                          className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1"
                          style={{ background: "var(--blue)" }}
                        />
                      )}
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--foreground-muted)" }}>
                      {n.mensaje}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--foreground-subtle)" }}>
                      {tiempoRelativo(n.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 0 && (
            <div
              className="px-4 py-2.5 text-center border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <a
                href={verTodasLink}
                className="text-xs font-semibold"
                style={{ color: "var(--blue)" }}
                onClick={() => setAbierto(false)}
              >
                Ver todas →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
