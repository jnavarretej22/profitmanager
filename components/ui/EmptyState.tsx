import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icono: LucideIcon
  titulo: string
  subtitulo?: string
  cta?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({ icono: Icono, titulo, subtitulo, cta, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}
    >
      <span
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--blue-bg)" }}
      >
        <Icono size={28} style={{ color: "var(--blue)" }} />
      </span>
      <h3
        className="mb-1 text-lg font-bold"
        style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
      >
        {titulo}
      </h3>
      {subtitulo && (
        <p className="mb-6 text-sm max-w-xs" style={{ color: "var(--foreground-muted)" }}>
          {subtitulo}
        </p>
      )}
      {cta && (
        <>
          {cta.onClick && (
            <button onClick={cta.onClick} className="btn-primary">
              {cta.label}
            </button>
          )}
          {cta.href && (
            <a href={cta.href} className="btn-primary">
              {cta.label}
            </a>
          )}
        </>
      )}
    </div>
  )
}
