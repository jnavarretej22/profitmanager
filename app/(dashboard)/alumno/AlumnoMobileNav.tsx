"use client"

import { cerrarSesion } from "@/lib/cerrar-sesion"
import {
  X, LogOut, MessageCircle,
  LayoutDashboard, Dumbbell, UtensilsCrossed, TrendingUp, Calendar, User,
} from "lucide-react"
import { NavItem } from "@/components/layout/NavItem"
import { Brand } from "@/components/ui"

const NAV_ITEMS = [
  { href: "/alumno",                     label: "Inicio",          icono: LayoutDashboard },
  { href: "/alumno/mi-rutina",           label: "Mi rutina",       icono: Dumbbell },
  { href: "/alumno/mi-plan-alimenticio", label: "Mi alimentación", icono: UtensilsCrossed },
  { href: "/alumno/mi-progreso",         label: "Mi progreso",     icono: TrendingUp },
  { href: "/alumno/mi-agenda",           label: "Mi agenda",       icono: Calendar },
  { href: "/alumno/perfil",              label: "Mi perfil",       icono: User },
]

interface Props {
  coachNombre: string
  coachApellido: string
  coachEspecialidad: string | null
  whatsappLink: string | null
  mailtoLink: string
  abierto: boolean
  onCerrar: () => void
}

export function AlumnoMobileNav({
  coachNombre, coachApellido, coachEspecialidad, whatsappLink, mailtoLink,
  abierto, onCerrar,
}: Props) {
  const setAbierto = (v: boolean) => { if (!v) onCerrar() }

  return (
    <>

      {abierto && (
        <>
          {/* Backdrop oscuro sin blur — el blur+transparency mezclado con el topbar pill
              (que también tiene backdrop-filter) producía el efecto "transparente y bugeado" */}
          <div
            className="fixed inset-0 z-[55]"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => setAbierto(false)}
          />

          {/* bg explícito con Tailwind dark: variant evita problemas de var CSS
              no aplicada por GPU layers durante animaciones / backdrop-filter ancestros.
              isolation: isolate crea stacking context propio del drawer. */}
          <div
            className="fixed inset-y-0 left-0 z-[56] flex w-64 flex-col bg-white dark:bg-[#1A1D27]"
            style={{
              borderRight: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              isolation: "isolate",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-5 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <Brand size="sm" href="/alumno" />
              <button onClick={() => setAbierto(false)} className="btn-ghost p-1.5">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
              {NAV_ITEMS.map(({ href, label, icono: Icono }) => (
                <NavItem
                  key={href}
                  href={href}
                  icon={<Icono size={18} strokeWidth={2} />}
                  label={label}
                  onClick={() => setAbierto(false)}
                />
              ))}
            </nav>

            <div className="mx-3 mb-3 rounded-2xl overflow-hidden">
              <div
                className="p-4"
                style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Tu coach
                </p>
                <p className="text-sm font-bold text-white mb-0.5">
                  {coachNombre} {coachApellido}
                </p>
                {coachEspecialidad && (
                  <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {coachEspecialidad}
                  </p>
                )}
                <a
                  href={whatsappLink ?? mailtoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                  onClick={() => setAbierto(false)}
                >
                  <MessageCircle size={13} />
                  Contactar
                </a>
              </div>
            </div>

            <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => cerrarSesion()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
                style={{ color: "var(--foreground-muted)" }}
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
