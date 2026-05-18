"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export function CambiarEstadoCita({ citaId, estadoActual }: { citaId: string; estadoActual: string }) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function cambiarEstado(nuevoEstado: string) {
    setCargando(true); setError("")
    try {
      const res = await fetch(`/api/citas/${citaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.mensaje ?? "Error al cambiar el estado")
        return
      }
      router.push("/coach/agenda")
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  if (estadoActual !== "agendada") return null

  return (
    <div
      className="rounded-2xl p-4 space-y-2"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3 flex-wrap">
      <p className="text-sm font-semibold flex-1" style={{ color: "var(--foreground)" }}>
        Cambiar estado de la cita
      </p>
      {cargando ? (
        <Loader2 size={18} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => cambiarEstado("completada")}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all"
            style={{ background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green)33" }}
          >
            <CheckCircle2 size={14} /> Marcar completada
          </button>
          <button
            onClick={() => cambiarEstado("cancelada")}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all"
            style={{ background: "var(--red)15", color: "var(--red)", border: "1px solid var(--red)33" }}
          >
            <XCircle size={14} /> Cancelar cita
          </button>
        </div>
      )}
      </div>
      {error && <p className="text-xs font-medium" style={{ color: "var(--red)" }}>{error}</p>}
    </div>
  )
}
