"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Search } from "lucide-react"

export function FiltrosAlumnos() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [q, setQ] = useState(() => sp.get("q") ?? "")

  const objetivo = sp.get("objetivo") ?? ""
  const estado = sp.get("estado") ?? ""

  function commitParams(updater: (next: URLSearchParams) => void) {
    // Leemos de window.location en vez de sp.toString() para evitar closure stale
    // si se disparan dos commits seguidos antes de que React re-renderice.
    const next = new URLSearchParams(window.location.search)
    updater(next)
    const qs = next.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  function setParam(key: string, value: string) {
    commitParams((next) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
  }

  // Si la URL cambia desde afuera (ej. navegación al sidebar "Mis alumnos"),
  // sincroniza el input. setQ con función evita re-renders innecesarios.
  useEffect(() => {
    const urlQ = sp.get("q") ?? ""
    setQ((prev) => (prev !== urlQ ? urlQ : prev))
  }, [sp])

  // Debounce: cuando el usuario deja de tipear 300ms, escribe en la URL.
  useEffect(() => {
    if (q === (sp.get("q") ?? "")) return
    const t = setTimeout(() => {
      commitParams((next) => {
        if (q) next.set("q", q)
        else next.delete("q")
      })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row"
      style={{ opacity: pending ? 0.7 : 1, transition: "opacity 120ms" }}
    >
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--foreground-subtle)" }}
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre..."
          className="input-base pl-9"
        />
      </div>

      <select
        value={objetivo}
        onChange={(e) => setParam("objetivo", e.target.value)}
        className="input-base sm:w-48"
      >
        <option value="">Todos los objetivos</option>
        <option value="hipertrofia">Hipertrofia</option>
        <option value="perdida_grasa">Pérdida de grasa</option>
        <option value="fuerza">Fuerza</option>
        <option value="resistencia">Resistencia</option>
        <option value="general">General</option>
      </select>

      <select
        value={estado}
        onChange={(e) => setParam("estado", e.target.value)}
        className="input-base sm:w-40"
      >
        <option value="">Activos e inactivos</option>
        <option value="activo">Solo activos</option>
        <option value="archivado">Archivados</option>
      </select>
    </div>
  )
}
