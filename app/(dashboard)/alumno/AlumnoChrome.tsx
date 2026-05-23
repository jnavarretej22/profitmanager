"use client"

import { useEffect, useState } from "react"
import {
  Menu, MessageCircle,
  LayoutDashboard, Dumbbell, UtensilsCrossed, TrendingUp, Calendar, User,
} from "lucide-react"
import { Avatar, Brand } from "@/components/ui"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { NotificacionesPanel, WatermarkFooter } from "@/components/layout"
import { NavItem } from "@/components/layout/NavItem"
import { AlumnoMobileNav } from "./AlumnoMobileNav"

const SIDEBAR_OCULTO_KEY = "profitmanager:sidebarOcultoDesktop"

// Los iconos son componentes (funciones) y NO se pueden pasar como props desde un
// server component a un client component (Next.js no los puede serializar).
// Por eso NAV_ITEMS vive aquí, en el cliente.
const NAV_ITEMS = [
  { href: "/alumno",                     label: "Inicio",          icono: LayoutDashboard },
  { href: "/alumno/mi-rutina",           label: "Mi rutina",       icono: Dumbbell },
  { href: "/alumno/mi-plan-alimenticio", label: "Mi alimentación", icono: UtensilsCrossed },
  { href: "/alumno/mi-progreso",         label: "Mi progreso",     icono: TrendingUp },
  { href: "/alumno/mi-agenda",           label: "Mi agenda",       icono: Calendar },
  { href: "/alumno/perfil",              label: "Mi perfil",       icono: User },
] as const

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  link: string | null
  leida: boolean
  created_at: string
}

interface AlumnoChromeProps {
  children: React.ReactNode
  user: { nombre: string; apellido: string }
  coach: {
    nombre:       string
    apellido:     string
    especialidad: string | null
  }
  whatsappLink: string | null
  mailtoLink:   string
  notifSinLeer: number
  notificaciones: Notificacion[]
  marcaAgua:    boolean
  logoutForm:   React.ReactNode
}

export function AlumnoChrome({
  children, user, coach, whatsappLink, mailtoLink,
  notifSinLeer, notificaciones, marcaAgua, logoutForm,
}: AlumnoChromeProps) {
  const [ocultoDesktop, setOcultoDesktop] = useState(false)
  // Drawer mobile — controlado desde aquí para poder ocultar el topbar pill
  // mientras está abierto (el backdrop-filter del pill confundía al drawer).
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  // fechaLabel se setea solo en cliente para evitar hydration mismatch:
  // new Date() devuelve valores distintos en server vs cliente según timezone.
  const [fechaLabel, setFechaLabel] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    setOcultoDesktop(window.localStorage.getItem(SIDEBAR_OCULTO_KEY) === "true")
    setFechaLabel(
      new Date().toLocaleDateString("es-EC", {
        weekday: "long", day: "numeric", month: "long",
      })
    )

    // Sincronizar entre pestañas
    function onStorage(e: StorageEvent) {
      if (e.key === SIDEBAR_OCULTO_KEY) {
        setOcultoDesktop(e.newValue === "true")
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  function toggleDesktop() {
    setOcultoDesktop((v) => {
      const next = !v
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDEBAR_OCULTO_KEY, String(next))
      }
      return next
    })
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* ── Sidebar desktop ─────────────────────────────── */}
      {!ocultoDesktop && (
        <aside
          className="hidden md:flex flex-col w-60 flex-shrink-0 fixed top-0 left-0 h-full z-30"
          style={{
            background:  "var(--background-card)",
            borderRight: "1px solid var(--border)",
          }}
        >
          {/* Header del sidebar — misma altura que el topbar (56px) para alinear visualmente */}
          <div
            className="flex items-center px-5 border-b"
            style={{ borderColor: "var(--border)", height: "56px" }}
          >
            <Brand size="sm" href="/alumno" />
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icono: Icono }) => (
              <NavItem
                key={href}
                href={href}
                icon={<Icono size={18} strokeWidth={2} />}
                label={label}
              />
            ))}
          </nav>

          <div className="mx-3 mb-3 rounded-2xl overflow-hidden">
            <div className="p-4" style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
              <p className="text-xs font-semibold text-white/70 mb-1">Tu coach</p>
              <p className="text-sm font-bold text-white mb-0.5">
                {coach.nombre} {coach.apellido}
              </p>
              {coach.especialidad && (
                <p className="text-xs text-white/70 mb-3">{coach.especialidad}</p>
              )}
              <div className="flex gap-2">
                <a
                  href={whatsappLink ?? mailtoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                >
                  <MessageCircle size={13} />
                  Contactar
                </a>
              </div>
            </div>
          </div>

          <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            {logoutForm}
          </div>
        </aside>
      )}

      {/* ── Topbar mobile — pill flotante. Se oculta cuando el drawer abre
              para que el backdrop-filter del pill no interfiera con el drawer. */}
      {!drawerAbierto && (
        <div className="md:hidden fixed top-3 left-3 right-3 z-30">
          <div
            className="flex items-center justify-between px-3 py-2 rounded-full border"
            style={{
              background: "color-mix(in srgb, var(--background-card) 88%, transparent)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawerAbierto(true)}
                className="btn-ghost p-1.5"
                aria-label="Abrir menú"
              >
                <Menu size={20} />
              </button>
              <Brand size="sm" href="/alumno" />
            </div>
            <div className="flex items-center gap-1">
              <NotificacionesPanel notificacionesSinLeer={notifSinLeer} notificaciones={notificaciones} />
              <ThemeToggle size="sm" />
              <Avatar nombre={user.nombre} apellido={user.apellido} size="sm" />
            </div>
          </div>
        </div>
      )}

      {/* Drawer mobile (fuera del pill para evitar conflictos con backdrop-filter) */}
      <AlumnoMobileNav
        coachNombre={coach.nombre}
        coachApellido={coach.apellido}
        coachEspecialidad={coach.especialidad}
        whatsappLink={whatsappLink}
        mailtoLink={mailtoLink}
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
      />

      {/* ── Topbar desktop — pill flotante ──────────────── */}
      <div
        className="hidden md:block fixed top-3 right-3 sm:right-4 z-20"
        style={{ left: ocultoDesktop ? "12px" : "calc(240px + 12px)" }}
      >
        <header
          className="flex items-center justify-between mx-auto max-w-5xl px-4 sm:px-5 py-2.5 rounded-full border"
          style={{
            background: "color-mix(in srgb, var(--background-card) 88%, transparent)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={toggleDesktop}
              className="btn-ghost p-1.5 flex-shrink-0"
              aria-label={ocultoDesktop ? "Mostrar menú lateral" : "Ocultar menú lateral"}
            >
              <Menu size={20} />
            </button>
            <p className="text-xs capitalize truncate" style={{ color: "var(--foreground-muted)" }}>
              {fechaLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={whatsappLink ?? mailtoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <MessageCircle size={14} />
              <span className="hidden lg:inline">Contactar a mi coach</span>
            </a>
            <ThemeToggle size="sm" />
            <NotificacionesPanel notificacionesSinLeer={notifSinLeer} notificaciones={notificaciones} />
            <Avatar nombre={user.nombre} apellido={user.apellido} size="sm" />
          </div>
        </header>
      </div>

      {/* ── Contenido principal ─────────────────────────── */}
      <main
        className={`flex-1 pt-20 px-3 sm:px-4 md:px-8 pb-8 ${ocultoDesktop ? "" : "md:ml-60"}`}
        style={{ paddingBottom: marcaAgua ? "3.5rem" : "2rem" }}
      >
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {marcaAgua && <WatermarkFooter />}
    </div>
  )
}
