"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  icono: LucideIcon
  label: string
  badge?: number
  onClick?: () => void
}

export function NavItem({ href, icono: Icono, label, badge, onClick }: NavItemProps) {
  const pathname = usePathname()
  const activo = pathname === href || (href !== "/" && pathname.startsWith(href))

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
      )}
      style={
        activo
          ? {
              background: "var(--sidebar-item-active-bg)",
              color: "var(--sidebar-item-active-text)",
            }
          : {
              color: "var(--foreground-muted)",
            }
      }
      onMouseEnter={(e) => {
        if (!activo) {
          e.currentTarget.style.background = "var(--sidebar-item-hover)"
          e.currentTarget.style.color = "var(--foreground)"
        }
      }}
      onMouseLeave={(e) => {
        if (!activo) {
          e.currentTarget.style.background = ""
          e.currentTarget.style.color = "var(--foreground-muted)"
        }
      }}
    >
      <Icono size={18} strokeWidth={activo ? 2.5 : 2} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold"
          style={{ background: "var(--red)", color: "white" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  )
}
