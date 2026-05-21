"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookmarkPlus, Loader2, Lock, X } from "lucide-react"

interface Props {
  rutinaId: string
  nombreSugerido: string
  tieneFeature: boolean
}

export function GuardarComoTemplateBtn({ rutinaId, nombreSugerido, tieneFeature }: Props) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState(`${nombreSugerido} (template)`)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  if (!tieneFeature) {
    return (
      <button
        type="button"
        className="btn-secondary opacity-60 cursor-not-allowed"
        title="Disponible en el Plan Inicial"
        onClick={() => router.push("/coach/mi-plan")}
      >
        <Lock size={14} />
        Guardar como template
      </button>
    )
  }

  async function clonar() {
    setError("")
    setCargando(true)
    try {
      const res = await fetch(`/api/rutinas/${rutinaId}/clonar-template`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nombre: nombre.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.mensaje ?? "No se pudo guardar como template")
        return
      }
      setAbierto(false)
      router.push(`/coach/rutinas/${data.template.id}`)
      router.refresh()
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="btn-secondary"
        title="Guardar esta rutina como template reutilizable"
      >
        <BookmarkPlus size={14} />
        Guardar como template
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => !cargando && setAbierto(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                  Guardar como template
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                  Crearás una copia reutilizable. La rutina actual se mantiene asignada al alumno.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={cargando}
                className="btn-ghost p-1.5 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                Nombre del template
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={cargando}
                className="input-base"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={cargando}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={clonar}
                disabled={cargando || nombre.trim().length < 2}
                className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
              >
                {cargando ? <Loader2 size={14} className="animate-spin" /> : <BookmarkPlus size={14} />}
                Guardar template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
