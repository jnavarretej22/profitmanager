import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type StatVariant = "blue" | "green" | "orange" | "neutral" | "red" | "purple"

const GRADIENTS: Record<Exclude<StatVariant, "neutral">, string> = {
  blue:   "linear-gradient(135deg, #2D7DF6 0%, #1656C4 100%)",
  green:  "linear-gradient(135deg, #22C55E 0%, #15803D 100%)",
  orange: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)",
  red:    "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
  purple: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
}

const NEUTRAL_ICON_BG: Record<StatVariant, string> = {
  blue:    "var(--blue-bg)",
  green:   "var(--green-bg)",
  orange:  "var(--orange-bg)",
  red:     "var(--red-bg)",
  purple:  "var(--purple-bg)",
  neutral: "var(--background-hover)",
}

const NEUTRAL_ICON_COLOR: Record<StatVariant, string> = {
  blue:    "var(--blue)",
  green:   "var(--green)",
  orange:  "var(--orange)",
  red:     "var(--red)",
  purple:  "var(--purple)",
  neutral: "var(--foreground-muted)",
}

interface StatCardProps {
  titulo: string
  valor: string | number
  label?: string
  icono: LucideIcon
  variante?: StatVariant
  trend?: number
  className?: string
}

export function StatCard({
  titulo, valor, label, icono: Icono,
  variante = "neutral", trend, className,
}: StatCardProps) {
  const esColorido = variante !== "neutral"

  const TrendIcon =
    trend === undefined ? null
    : trend > 0 ? TrendingUp
    : trend < 0 ? TrendingDown
    : Minus

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl p-5 transition-all duration-200", className)}
      style={
        esColorido
          ? {
              background: GRADIENTS[variante as keyof typeof GRADIENTS],
              boxShadow: "var(--shadow-md)",
            }
          : {
              background: "var(--background-card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }
      }
    >
      {/* Orbe decorativo para cards coloreadas */}
      {esColorido && (
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, white, transparent)" }}
        />
      )}

      <div className="relative flex items-start gap-3.5">
        {/* Ícono — izquierda */}
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            background: esColorido ? "rgba(255,255,255,0.22)" : NEUTRAL_ICON_BG[variante],
            color:      esColorido ? "white"                  : NEUTRAL_ICON_COLOR[variante],
          }}
        >
          <Icono size={20} />
        </span>

        {/* Contenido — derecha */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-1"
            style={{ color: esColorido ? "rgba(255,255,255,0.72)" : "var(--foreground-muted)" }}
          >
            {titulo}
          </p>

          <div className="flex items-end justify-between gap-2">
            <p
              className="text-2xl font-extrabold leading-none"
              style={{
                letterSpacing: "-0.03em",
                color: esColorido ? "white" : "var(--foreground)",
              }}
            >
              {valor}
            </p>

            {TrendIcon && trend !== undefined && (
              <div
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0"
                style={{
                  background: esColorido
                    ? "rgba(255,255,255,0.2)"
                    : trend > 0 ? "var(--green-bg)" : trend < 0 ? "var(--red-bg)" : "var(--background-hover)",
                  color: esColorido
                    ? "white"
                    : trend > 0 ? "var(--green)" : trend < 0 ? "var(--red)" : "var(--foreground-muted)",
                }}
              >
                <TrendIcon size={11} />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>

          {label && (
            <p
              className="mt-0.5 text-xs"
              style={{ color: esColorido ? "rgba(255,255,255,0.65)" : "var(--foreground-muted)" }}
            >
              {label}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
