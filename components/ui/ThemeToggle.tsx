"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  size?: "sm" | "md"
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { tema, toggleTema, montado } = useTheme()

  if (!montado) {
    return (
      <div
        className={cn(
          "rounded-xl border",
          size === "sm" ? "h-8 w-8" : "h-9 w-9",
          className
        )}
        style={{ background: "var(--background-hover)", borderColor: "var(--border)" }}
      />
    )
  }

  return (
    <button
      onClick={toggleTema}
      aria-label={tema === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      className={cn(
        "flex items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className
      )}
      style={{
        background: "var(--background-card)",
        borderColor: "var(--border)",
        color: "var(--foreground-muted)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {tema === "light" ? (
        <Moon size={size === "sm" ? 14 : 16} />
      ) : (
        <Sun size={size === "sm" ? 14 : 16} style={{ color: "var(--orange)" }} />
      )}
    </button>
  )
}
