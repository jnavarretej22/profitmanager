"use client"

import { Calendar, CheckCircle2, AlertTriangle, Unlink } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  conectado: boolean
  googleStatus: "ok" | "error" | null
}

export function GoogleCalendarSection({ conectado, googleStatus }: Props) {
  const [desconectando, setDesconectando] = useState(false)
  const [desconectado, setDesconectado] = useState(false)
  const router = useRouter()

  async function desconectar() {
    setDesconectando(true)
    try {
      const res = await fetch("/api/coach/google-disconnect", { method: "DELETE" })
      if (res.ok) {
        setDesconectado(true)
        router.refresh()
      }
    } finally {
      setDesconectando(false)
    }
  }

  const estaConectado = conectado && !desconectado

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--blue-bg)" }}>
          <Calendar size={20} style={{ color: "var(--blue)" }} />
        </span>
        <div>
          <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Google Calendar</h3>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            Genera links de Google Meet automáticos en tus citas
          </p>
        </div>
      </div>

      {/* Feedback de la operación OAuth */}
      {googleStatus === "ok" && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4" style={{ background: "var(--green-bg)" }}>
          <CheckCircle2 size={15} style={{ color: "var(--green)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>
            Google Calendar conectado correctamente
          </p>
        </div>
      )}
      {googleStatus === "error" && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4" style={{ background: "var(--red)15" }}>
          <AlertTriangle size={15} style={{ color: "var(--red)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--red)" }}>
            Error al conectar. Intenta de nuevo.
          </p>
        </div>
      )}

      {estaConectado ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>Conectado</p>
          </div>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            Tus citas online generarán un link de Meet automáticamente.
          </p>
          <button
            onClick={desconectar}
            disabled={desconectando}
            className="btn-secondary text-xs"
            style={{ color: "var(--red)", borderColor: "var(--red)44" }}
          >
            <Unlink size={13} />
            {desconectando ? "Desconectando..." : "Desconectar Google Calendar"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {desconectado && (
            <p className="text-xs font-medium" style={{ color: "var(--orange)" }}>Google Calendar desconectado.</p>
          )}
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            No conectado. Conéctate para generar links de Meet automáticamente en tus citas.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/google/connect" className="btn-primary text-sm inline-flex">
            <Calendar size={15} />
            Conectar Google Calendar
          </a>
        </div>
      )}
    </div>
  )
}
