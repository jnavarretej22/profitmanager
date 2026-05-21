"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  // Recibe el ícono ya renderizado como JSX (serializable a través del límite server→client).
  // Pasar el componente (LucideIcon) crashea en Next.js 16: forwardRef no es serializable.
  icon: React.ReactNode
  label: string
  badge?: number
  onClick?: () => void
}

export function NavItem({ href, icon, label, badge, onClick }: NavItemProps) {
  const pathname = usePathname()
  const rutasRaiz = ["/admin", "/coach", "/alumno"]
  const activo =
    pathname === href ||
    (!rutasRaiz.includes(href) && href !== "/" && pathname.startsWith(href + "/"))

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
      {icon}
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
