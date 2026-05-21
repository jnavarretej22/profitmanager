"use client"

import Link from "next/link"
import { useState } from "react"
import { Globe, Copy, Check, ExternalLink, Settings, Lock } from "lucide-react"

interface Props {
  plan:                  "gratis" | "inicial"
  slug:                  string | null
  perfilPublicoActivo:   boolean
}

export function PerfilPublicoWidget({ plan, slug, perfilPublicoActivo }: Props) {
  const [copiado, setCopiado] = useState(false)

  const esGratis = plan === "gratis"
  const estaActivo = !esGratis && perfilPublicoActivo && !!slug
  const necesitaConfigurar = !esGratis && !estaActivo

  async function copiar() {
    if (!slug) return
    const url = `${window.location.origin}/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Clipboard puede fallar en HTTP / permisos — fallback silencioso
    }
  }

  // ── Variante: plan Gratis (teaser de upgrade) ────────────────────────────
  if (esGratis) {
    return (
      <Link
        href="/coach/mi-plan"
        className="relative overflow-hidden flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-150 hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, var(--blue-bg), var(--purple-bg))",
          border:     "1px solid var(--border)",
          boxShadow:  "var(--shadow-sm)",
        }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: "var(--background-card)", color: "var(--blue)" }}
        >
          <Globe size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              Atrae nuevos alumnos con tu perfil público
            </p>
            <Lock size={12} style={{ color: "var(--foreground-muted)" }} />
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            Una URL personal con tu foto, bio y botón de contacto — disponible en el Plan Inicial ($15/mes)
          </p>
        </div>
        <span
          className="hidden sm:inline-flex items-center gap-1 text-xs font-bold rounded-lg px-3 py-1.5 flex-shrink-0"
          style={{ background: "var(--blue)", color: "white" }}
        >
          Subir a Inicial →
        </span>
      </Link>
    )
  }

  // ── Variante: plan Inicial pero sin configurar ───────────────────────────
  if (necesitaConfigurar) {
    return (
      <Link
        href="/coach/mi-perfil-publico"
        className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-150 hover:-translate-y-0.5"
        style={{
          background: "var(--background-card)",
          border:     "1px solid var(--border)",
          boxShadow:  "var(--shadow-sm)",
        }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: "var(--orange-bg)", color: "var(--orange)" }}
        >
          <Globe size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            Activa tu perfil público
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            Comparte un link personal con tu bio y contacto para que clientes nuevos te encuentren
          </p>
        </div>
        <span
          className="hidden sm:inline-flex items-center gap-1 text-xs font-bold flex-shrink-0"
          style={{ color: "var(--blue)" }}
        >
          Configurar →
        </span>
      </Link>
    )
  }

  // ── Variante: activo (mostrar URL + acciones) ────────────────────────────
  return (
    <div
      className="rounded-2xl px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center"
      style={{
        background: "var(--background-card)",
        border:     "1px solid var(--border)",
        boxShadow:  "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: "var(--green-bg)", color: "var(--green)" }}
        >
          <Globe size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--foreground-muted)" }}>
            Tu perfil público está activo
          </p>
          <p
            className="text-sm font-bold truncate"
            style={{ color: "var(--foreground)", fontFamily: "monospace" }}
          >
            profitmanager.app/{slug}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={copiar}
          aria-label="Copiar link"
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {copiado ? <Check size={13} /> : <Copy size={13} />}
          {copiado ? "Copiado" : "Copiar"}
        </button>
        <Link
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver perfil público"
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <ExternalLink size={13} />
          Ver
        </Link>
        <Link
          href="/coach/mi-perfil-publico"
          aria-label="Editar perfil público"
          className="btn-ghost text-xs py-1.5 px-2"
        >
          <Settings size={13} />
        </Link>
      </div>
    </div>
  )
}
