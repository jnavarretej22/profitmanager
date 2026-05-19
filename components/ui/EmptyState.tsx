import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyVariant = "blue" | "orange" | "green" | "purple" | "red"

const COLORS: Record<EmptyVariant, { bg: string; icon: string; halo: string }> = {
  blue:   { bg: "var(--blue-bg)",   icon: "var(--blue)",   halo: "rgba(45,125,246,0.12)" },
  orange: { bg: "var(--orange-bg)", icon: "var(--orange)", halo: "rgba(249,115,22,0.12)" },
  green:  { bg: "var(--green-bg)",  icon: "var(--green)",  halo: "rgba(34,197,94,0.12)"  },
  purple: { bg: "var(--purple-bg)", icon: "var(--purple)", halo: "rgba(139,92,246,0.12)" },
  red:    { bg: "var(--red-bg)",    icon: "var(--red)",    halo: "rgba(239,68,68,0.12)"  },
}

interface EmptyStateProps {
  icono: LucideIcon
  titulo: string
  subtitulo?: string
  variante?: EmptyVariant
  cta?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({
  icono: Icono, titulo, subtitulo, variante = "blue", cta, className,
}: EmptyStateProps) {
  const c = COLORS[variante]

  return (
    <div
      className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}
    >
      {/* Ícono con halo */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Halo exterior */}
        <div
          className="absolute h-28 w-28 rounded-full"
          style={{ background: c.halo }}
        />
        {/* Halo intermedio */}
        <div
          className="absolute h-20 w-20 rounded-full opacity-60"
          style={{ background: c.halo }}
        />
        {/* Contenedor del ícono */}
        <span
          className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: c.bg }}
        >
          <Icono size={30} style={{ color: c.icon }} />
        </span>
      </div>

      <h3
        className="mb-1.5 text-base font-bold"
        style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
      >
        {titulo}
      </h3>

      {subtitulo && (
        <p
          className="mb-6 text-sm max-w-xs leading-relaxed"
          style={{ color: "var(--foreground-muted)" }}
        >
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
