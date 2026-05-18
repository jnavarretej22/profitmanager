import { cn } from "@/lib/utils"

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "blue"
  | "purple"
  | "orange"
  | "plan-gratis"
  | "plan-inicial"

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  success:       { bg: "var(--green-bg)",  color: "var(--green)" },
  warning:       { bg: "var(--orange-bg)", color: "var(--orange)" },
  orange:        { bg: "var(--orange-bg)", color: "var(--orange)" },
  danger:        { bg: "var(--red-bg)",    color: "var(--red)" },
  neutral:       { bg: "var(--background-hover)", color: "var(--foreground-muted)" },
  blue:          { bg: "var(--blue-bg)",   color: "var(--blue)" },
  purple:        { bg: "var(--purple-bg)", color: "var(--purple)" },
  "plan-gratis": { bg: "var(--background-hover)", color: "var(--foreground-muted)" },
  "plan-inicial":{ bg: "var(--blue-bg)",   color: "var(--blue)" },
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = "neutral", className, dot }: BadgeProps) {
  const { bg, color } = variantStyles[variant]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
      style={{ background: bg, color }}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
      )}
      {children}
    </span>
  )
}
