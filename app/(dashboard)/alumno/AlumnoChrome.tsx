"use client"

import { useEffect, useState } from "react"
import { Menu, MessageCircle } from "lucide-react"
import { Avatar, Brand } from "@/components/ui"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { NotificacionesPanel, WatermarkFooter } from "@/components/layout"
import { NavItem } from "@/components/layout/NavItem"
import { AlumnoMobileNav } from "./AlumnoMobileNav"
import type { LucideIcon } from "lucide-react"

const SIDEBAR_OCULTO_KEY = "profitmanager:sidebarOcultoDesktop"

interface NavItemDef {
  href:  string
  label: string
  icono: LucideIcon
}

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
  navItems: NavItemDef[]
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
  children, navItems, user, coach, whatsappLink, mailtoLink,
  notifSinLeer, notificaciones, marcaAgua, logoutForm,
}: AlumnoChromeProps) {
  const [ocultoDesktop, setOcultoDesktop] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setOcultoDesktop(window.localStorage.getItem(SIDEBAR_OCULTO_KEY) === "true")

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

  const fechaLabel = new Date().toLocaleDateString("es-EC", {
    weekday: "long", day: "numeric", month: "long",
  })

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
          <div
            className="flex items-center justify-between px-5 py-5 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <Brand size="sm" href="/alumno" />
            <ThemeToggle />
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
            {navItems.map(({ href, label, icono: Icono }) => (
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

      {/* ── Topbar mobile ──────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: "var(--background-card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <AlumnoMobileNav
            coachNombre={coach.nombre}
            coachApellido={coach.apellido}
            coachEspecialidad={coach.especialidad}
            whatsappLink={whatsappLink}
            mailtoLink={mailtoLink}
          />
          <Brand size="sm" href="/alumno" />
        </div>
        <div className="flex items-center gap-2">
          <NotificacionesPanel notificacionesSinLeer={notifSinLeer} notificaciones={notificaciones} />
          <ThemeToggle />
          <Avatar nombre={user.nombre} apellido={user.apellido} size="sm" />
        </div>
      </div>

      {/* ── Topbar desktop ─────────────────────────────── */}
      <header
        className="hidden md:flex fixed top-0 right-0 z-20 items-center justify-between px-6 py-3.5"
        style={{
          background: "var(--background-card)",
          borderBottom: "1px solid var(--border)",
          height: "56px",
          left: ocultoDesktop ? "0" : "240px",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleDesktop}
            className="btn-ghost"
            aria-label={ocultoDesktop ? "Mostrar menú lateral" : "Ocultar menú lateral"}
          >
            <Menu size={20} />
          </button>
          <p className="text-xs capitalize truncate" style={{ color: "var(--foreground-muted)" }}>
            {fechaLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={whatsappLink ?? mailtoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <MessageCircle size={14} />
            Contactar a mi coach
          </a>
          <NotificacionesPanel notificacionesSinLeer={notifSinLeer} notificaciones={notificaciones} />
          <Avatar nombre={user.nombre} apellido={user.apellido} size="sm" />
        </div>
      </header>

      {/* ── Contenido principal ─────────────────────────── */}
      <main
        className={`flex-1 pt-16 md:pt-[56px] px-3 sm:px-4 md:px-8 pb-8 ${ocultoDesktop ? "" : "md:ml-60"}`}
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
