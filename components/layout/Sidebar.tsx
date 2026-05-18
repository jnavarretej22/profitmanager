"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, Dumbbell, UtensilsCrossed, Calendar,
  CreditCard, LogOut, Settings,
  BarChart2, ClipboardList, X, Globe, UserPlus,
} from "lucide-react"
import { Brand } from "@/components/ui/Brand"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { NavItem } from "./NavItem"
import { PlanFeatureService } from "@/lib/plan-features"
import type { PlanActual, EstadoPlan } from "@prisma/client"

interface SidebarProps {
  rol: "coach" | "alumno" | "admin"
  nombre: string
  apellido: string
  email: string
  plan?: PlanActual
  estadoPlan?: EstadoPlan
  notificacionesSinLeer?: number
  solicitudesPendientes?: number
  abierto: boolean
  onCerrar: () => void
}

const NAV_COACH = [
  { href: "/coach", icono: LayoutDashboard, label: "Dashboard" },
  { href: "/coach/alumnos", icono: Users, label: "Mis alumnos" },
  { href: "/coach/rutinas", icono: Dumbbell, label: "Rutinas" },
  { href: "/coach/planes-alimenticios", icono: UtensilsCrossed, label: "Planes alimenticios" },
  { href: "/coach/agenda", icono: Calendar, label: "Agenda" },
  { href: "/coach/solicitudes", icono: UserPlus, label: "Solicitudes" },
  { href: "/coach/mi-plan", icono: CreditCard, label: "Mi plan" },
  { href: "/coach/mi-perfil-publico", icono: Globe, label: "Perfil público" },
  { href: "/coach/perfil", icono: Settings, label: "Configuración" },
]

const NAV_ALUMNO = [
  { href: "/alumno", icono: LayoutDashboard, label: "Inicio" },
  { href: "/alumno/mi-rutina", icono: Dumbbell, label: "Mi rutina" },
  { href: "/alumno/mi-plan-alimenticio", icono: UtensilsCrossed, label: "Mi plan alimenticio" },
  { href: "/alumno/mi-progreso", icono: BarChart2, label: "Mi progreso" },
  { href: "/alumno/mi-agenda", icono: Calendar, label: "Mi agenda" },
  { href: "/alumno/perfil", icono: Settings, label: "Mi perfil" },
]

const NAV_ADMIN = [
  { href: "/admin", icono: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/coaches", icono: Users, label: "Coaches" },
  { href: "/admin/pagos", icono: CreditCard, label: "Pagos" },
  { href: "/admin/planes", icono: ClipboardList, label: "Planes" },
  { href: "/admin/reportes", icono: BarChart2, label: "Reportes" },
]

export function Sidebar({
  rol, nombre, apellido, email, plan, estadoPlan,
  notificacionesSinLeer = 0, solicitudesPendientes = 0, abierto, onCerrar,
}: SidebarProps) {
  const navItems = rol === "coach" ? NAV_COACH : rol === "alumno" ? NAV_ALUMNO : NAV_ADMIN

  const SidebarContent = (
    <aside
      className="flex h-full w-[260px] flex-col"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5">
        <Brand size="sm" />
        {/* Botón cerrar en mobile */}
        <button
          onClick={onCerrar}
          className="md:hidden btn-ghost p-1.5"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icono={item.icono}
              label={item.label}
              onClick={onCerrar}
              badge={
                item.href === "/coach/solicitudes" && solicitudesPendientes > 0
                  ? solicitudesPendientes
                  : undefined
              }
            />
          ))}
        </div>
      </nav>

      {/* Plan badge (solo coach) */}
      {rol === "coach" && plan && (
        <div
          className="mx-3 mb-3 rounded-xl p-3"
          style={{
            background: estadoPlan === "solo_lectura" ? "var(--red-bg)" : "var(--blue-bg)",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
              Tu plan
            </span>
            <Badge variant={estadoPlan === "solo_lectura" ? "danger" : plan === "gratis" ? "plan-gratis" : "plan-inicial"}>
              {estadoPlan === "solo_lectura" ? "Vencido" : PlanFeatureService.getNombrePlan(plan)}
            </Badge>
          </div>
          {estadoPlan !== "solo_lectura" && plan === "gratis" && (
            <Link
              href="/coach/mi-plan"
              className="block text-xs font-semibold mt-1"
              style={{ color: "var(--blue)" }}
              onClick={onCerrar}
            >
              Subir a Plan Inicial →
            </Link>
          )}
          {estadoPlan === "solo_lectura" && (
            <Link
              href="/coach/mi-plan"
              className="block text-xs font-semibold mt-1"
              style={{ color: "var(--red)" }}
              onClick={onCerrar}
            >
              Renovar plan →
            </Link>
          )}
        </div>
      )}

      {/* Usuario + Logout */}
      <div
        className="border-t px-3 py-3"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar nombre={nombre} apellido={apellido} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {nombre} {apellido}
            </p>
            <p className="truncate text-xs" style={{ color: "var(--foreground-muted)" }}>
              {email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-ghost p-1.5 flex-shrink-0"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: siempre visible */}
      <div className="hidden md:flex md:flex-shrink-0">
        {SidebarContent}
      </div>

      {/* Mobile: drawer */}
      {abierto && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={onCerrar}
          />
          {/* Drawer */}
          <div
            className="fixed inset-y-0 left-0 z-40 md:hidden animate-slide-in"
          >
            {SidebarContent}
          </div>
        </>
      )}
    </>
  )
}
