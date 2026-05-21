"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export function FiltrosRutinas() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [pending, startTransition] = useTransition()

  const tipo = sp.get("tipo") ?? ""
  const objetivo = sp.get("objetivo") ?? ""

  function setParam(key: string, value: string) {
    // Leemos de window.location en vez de sp.toString() para evitar closure
    // stale si se disparan dos commits seguidos antes de que React re-renderice.
    const next = new URLSearchParams(window.location.search)
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  const tipos = [
    { label: "Todas",     value: "" },
    { label: "Asignadas", value: "asignada" },
    { label: "Templates", value: "template" },
  ]

  return (
    <div
      className="flex flex-wrap gap-2"
      style={{ opacity: pending ? 0.6 : 1, transition: "opacity 120ms" }}
    >
      {tipos.map((f) => {
        const activo = tipo === f.value
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => setParam("tipo", f.value)}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: activo ? "var(--blue)" : "var(--background-card)",
              color:      activo ? "white" : "var(--foreground-muted)",
              border:     `1px solid ${activo ? "var(--blue)" : "var(--border)"}`,
            }}
          >
            {f.label}
          </button>
        )
      })}
      <select
        value={objetivo}
        onChange={(e) => setParam("objetivo", e.target.value)}
        className="input-base py-1.5 text-xs ml-auto"
      >
        <option value="">Todos los objetivos</option>
        <option value="hipertrofia">Hipertrofia</option>
        <option value="perdida_grasa">Pérdida de grasa</option>
        <option value="fuerza">Fuerza</option>
        <option value="resistencia">Resistencia</option>
        <option value="general">General</option>
      </select>
    </div>
  )
}
