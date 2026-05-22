import { Dumbbell } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BrandProps {
  variant?: "full" | "icon" | "white"
  size?: "sm" | "md" | "lg"
  href?: string
  className?: string
}

export function Brand({ variant = "full", size = "md", href, className }: BrandProps) {
  const iconSize = { sm: 14, md: 18, lg: 22 }[size]
  const containerSize = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-11 w-11" }[size]
  const textSize = { sm: "text-sm", md: "text-base", lg: "text-xl" }[size]

  const Icon = (
    <span
      className={cn("flex items-center justify-center flex-shrink-0", containerSize)}
      style={{
        background: "linear-gradient(135deg, #2D7DF6, #F97316)",
        borderRadius: "9px",
      }}
    >
      <Dumbbell size={iconSize} color="white" strokeWidth={2.5} />
    </span>
  )

  const Text = variant !== "icon" && (
    <span
      className={cn("font-extrabold tracking-tight", textSize)}
      style={{
        color: variant === "white" ? "white" : "var(--foreground)",
        letterSpacing: "-0.02em",
      }}
    >
      ProFit{" "}
      <span style={{ color: variant === "white" ? "rgba(255,255,255,0.85)" : "var(--blue)" }}>
        Manager
      </span>
    </span>
  )

  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      {Icon}
      {Text}
    </span>
  )

  if (href !== undefined) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
