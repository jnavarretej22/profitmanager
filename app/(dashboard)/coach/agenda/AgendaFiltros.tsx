"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

interface Props {
  alumnos: { id: string; nombre: string }[]
}

export function AgendaFiltros({ alumnos }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  function actualizar(clave: string, valor: string) {
    const params = new URLSearchParams(sp.toString())
    if (valor) params.set(clave, valor)
    else params.delete(clave)
    router.push(`/coach/agenda?${params.toString()}`)
  }

  const ESTADOS = [
    { val: "",           label: "Todos" },
    { val: "agendada",   label: "Agendada" },
    { val: "completada", label: "Completada" },
    { val: "cancelada",  label: "Cancelada" },
  ]
  const MODALIDADES = [
    { val: "",           label: "Todas" },
    { val: "online",     label: "Online" },
    { val: "presencial", label: "Presencial" },
  ]

  const estadoActual    = sp.get("estado")    ?? ""
  const modalidadActual = sp.get("modalidad") ?? ""
  const alumnoActual    = sp.get("alumno_id") ?? ""

  return (
    <div
      className="rounded-2xl p-4 flex flex-wrap gap-3 items-center"
      style={{ background: "var(--background-card)", border: "1px solid var(--border)" }}
    >
      {/* Alumno selector */}
      <select
        value={alumnoActual}
        onChange={(e) => actualizar("alumno_id", e.target.value)}
        className="input-base !py-2 text-sm"
        style={{ minWidth: "180px", maxWidth: "220px" }}
      >
        <option value="">Todos los alumnos</option>
        {alumnos.map((a) => (
          <option key={a.id} value={a.id}>{a.nombre}</option>
        ))}
      </select>

      {/* Pills de estado */}
      <div className="flex gap-1.5 flex-wrap">
        {ESTADOS.map(({ val, label }) => (
          <button
            key={val}
            onClick={() => actualizar("estado", val)}
            className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
            style={{
              background: estadoActual === val ? "var(--blue)" : "var(--background)",
              color: estadoActual === val ? "white" : "var(--foreground-muted)",
              border: `1px solid ${estadoActual === val ? "var(--blue)" : "var(--border)"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Pills de modalidad */}
      <div className="flex gap-1.5 flex-wrap">
        {MODALIDADES.map(({ val, label }) => (
          <button
            key={val}
            onClick={() => actualizar("modalidad", val)}
            className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
            style={{
              background: modalidadActual === val ? "var(--orange)" : "var(--background)",
              color: modalidadActual === val ? "white" : "var(--foreground-muted)",
              border: `1px solid ${modalidadActual === val ? "var(--orange)" : "var(--border)"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
