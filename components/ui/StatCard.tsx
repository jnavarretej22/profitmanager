import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type StatVariant = "blue" | "green" | "orange" | "neutral" | "red"

const gradients: Record<StatVariant, string> = {
  blue:    "linear-gradient(135deg, #2D7DF6, #1F66D9)",
  green:   "linear-gradient(135deg, #22C55E, #16A34A)",
  orange:  "linear-gradient(135deg, #F97316, #EA580C)",
  red:     "linear-gradient(135deg, #EF4444, #DC2626)",
  neutral: "",
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
  titulo,
  valor,
  label,
  icono: Icono,
  variante = "neutral",
  trend,
  className,
}: StatCardProps) {
  const esColorido = variante !== "neutral"
  const gradiente = gradients[variante]

  const TrendIcon =
    trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus

  return (
    <div
      className={cn("rounded-2xl p-5 transition-all duration-200", className)}
      style={
        esColorido
          ? { background: gradiente, color: "white", boxShadow: "var(--shadow-md)" }
          : {
              background: "var(--background-card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              color: "var(--foreground)",
            }
      }
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-sm font-medium"
          style={{ color: esColorido ? "rgba(255,255,255,0.85)" : "var(--foreground-muted)" }}
        >
          {titulo}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: esColorido ? "rgba(255,255,255,0.2)" : "var(--blue-bg)",
            color: esColorido ? "white" : "var(--blue)",
          }}
        >
          <Icono size={18} />
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-3xl font-extrabold leading-none"
            style={{ letterSpacing: "-0.03em", color: esColorido ? "white" : "var(--foreground)" }}
          >
            {valor}
          </p>
          {label && (
            <p
              className="mt-1 text-sm"
              style={{ color: esColorido ? "rgba(255,255,255,0.75)" : "var(--foreground-muted)" }}
            >
              {label}
            </p>
          )}
        </div>

        {TrendIcon && trend !== undefined && (
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              background: esColorido
                ? "rgba(255,255,255,0.15)"
                : trend > 0
                ? "var(--green-bg)"
                : trend < 0
                ? "var(--red-bg)"
                : "var(--background-hover)",
              color: esColorido
                ? "white"
                : trend > 0
                ? "var(--green)"
                : trend < 0
                ? "var(--red)"
                : "var(--foreground-muted)",
            }}
          >
            <TrendIcon size={12} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
