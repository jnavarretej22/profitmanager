import type { LucideIcon } from "lucide-react"

interface Props {
  id:       string
  numero:   number
  icono:    LucideIcon
  titulo:   string
  resumen?: string
  children: React.ReactNode
}

export function Seccion({ id, numero, icono: Icono, titulo, resumen, children }: Props) {
  return (
    <section id={id} className="scroll-mt-24 mb-12">
      <div className="flex items-start gap-3 mb-4">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--blue-bg)", color: "var(--blue)" }}
        >
          <Icono size={20} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--foreground-subtle)" }}>
            Paso {numero}
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
            {titulo}
          </h2>
        </div>
      </div>

      {resumen && (
        <p className="text-base mb-5" style={{ color: "var(--foreground-muted)", lineHeight: "1.6" }}>
          {resumen}
        </p>
      )}

      <div
        className="prose-guia rounded-2xl p-5 sm:p-6 space-y-4"
        style={{
          background: "var(--background-card)",
          border:     "1px solid var(--border)",
          boxShadow:  "var(--shadow-sm)",
        }}
      >
        {children}
      </div>
    </section>
  )
}

// Item con bullet + título + descripción (para listados de pasos o features)
export function Item({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold mb-1" style={{ color: "var(--foreground)" }}>
        {titulo}
      </p>
      <p className="text-sm" style={{ color: "var(--foreground-muted)", lineHeight: "1.6" }}>
        {children}
      </p>
    </div>
  )
}

// Callout (info, warning, tip)
export function Callout({
  tipo = "info",
  children,
}: {
  tipo?: "info" | "warning" | "tip"
  children: React.ReactNode
}) {
  const colors = {
    info:    { bg: "var(--blue-bg)",   text: "var(--blue)",   border: "var(--blue)"   },
    warning: { bg: "var(--orange-bg)", text: "var(--orange)", border: "var(--orange)" },
    tip:     { bg: "var(--green-bg)",  text: "var(--green)",  border: "var(--green)"  },
  }
  const c = colors[tipo]
  return (
    <div
      className="rounded-xl p-4 text-sm"
      style={{
        background: c.bg,
        color:      c.text,
        borderLeft: `3px solid ${c.border}`,
        lineHeight: "1.55",
      }}
    >
      {children}
    </div>
  )
}
