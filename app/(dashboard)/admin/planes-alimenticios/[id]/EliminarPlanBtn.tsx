"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"

export function EliminarPlanBtn({ planId }: { planId: string }) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [confirma, setConfirma] = useState(false)

  async function eliminar() {
    setCargando(true)
    try {
      const res = await fetch(`/api/admin/planes-alimenticios/${planId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        alert(data.mensaje ?? "No se pudo eliminar el template.")
        setCargando(false)
        return
      }
      router.push("/admin/planes-alimenticios")
      router.refresh()
    } catch {
      alert("Error de conexión")
      setCargando(false)
    }
  }

  if (confirma) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: "var(--red)" }}>¿Eliminar?</span>
        <button
          onClick={eliminar}
          disabled={cargando}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--red)", color: "white" }}
        >
          {cargando ? <Loader2 size={14} className="animate-spin" /> : "Sí, eliminar"}
        </button>
        <button onClick={() => setConfirma(false)} disabled={cargando} className="btn-ghost text-sm">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirma(true)}
      className="btn-ghost text-sm"
      style={{ color: "var(--red)" }}
      aria-label="Eliminar template"
    >
      <Trash2 size={15} /> Eliminar
    </button>
  )
}
