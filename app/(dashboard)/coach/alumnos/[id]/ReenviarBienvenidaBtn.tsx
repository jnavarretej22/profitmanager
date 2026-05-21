"use client"

import { useState } from "react"
import { Mail, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ReenviarBienvenidaBtn({ alumnoId }: { alumnoId: string }) {
  const [estado, setEstado] = useState<"idle" | "cargando" | "enviado">("idle")

  async function handleClick() {
    if (estado !== "idle") return
    setEstado("cargando")
    try {
      const res = await fetch(`/api/coach/alumnos/${alumnoId}/reenviar-bienvenida`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.mensaje ?? "No se pudo reenviar el email.")
        setEstado("idle")
        return
      }
      setEstado("enviado")
      toast.success("Email de activación reenviado.")
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.")
      setEstado("idle")
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={estado !== "idle"}
      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
      style={{
        background: "var(--orange-bg)",
        color: "var(--orange)",
        border: "1px solid color-mix(in srgb, var(--orange) 20%, transparent)",
      }}
    >
      {estado === "cargando" ? (
        <Loader2 size={14} className="animate-spin" />
      ) : estado === "enviado" ? (
        <Check size={14} />
      ) : (
        <Mail size={14} />
      )}
      {estado === "enviado" ? "Email enviado" : "Reenviar email de activación"}
    </button>
  )
}
